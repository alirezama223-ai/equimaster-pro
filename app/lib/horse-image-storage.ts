import type { SupabaseClient } from "@supabase/supabase-js";
import { isAcceptedImageType } from "@/app/lib/listing-validation";
import { HorseListingImageMeta } from "@/app/types/horse-listing";

export const HORSE_IMAGES_BUCKET = "horse-images";

export function extractHorseImageStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${HORSE_IMAGES_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

export type ListingImageUploadInput = {
  file: File;
  isCover: boolean;
  name: string;
  type: string;
  size: number;
};

export type UploadedListingImage = {
  storagePath: string;
  publicUrl: string;
  isCover: boolean;
  meta: HorseListingImageMeta;
};

function sanitizeExtension(fileName: string): string {
  const match = fileName.match(/(\.[a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? "";
}

export function buildListingImageStoragePath(
  userId: string,
  listingId: string,
  originalName: string
): string {
  const ext = sanitizeExtension(originalName);
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  return `${userId}/${listingId}/${uniqueName}`;
}

export function getHorseImagePublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage
    .from(HORSE_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export function mapStorageUploadError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("bucket") && normalized.includes("not found")) {
    return "Image storage is not configured. Run supabase/migrations/003_horse_images_storage.sql in Supabase.";
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "You do not have permission to upload listing images.";
  }

  if (normalized.includes("payload too large") || normalized.includes("file size")) {
    return "One or more images exceed the upload size limit.";
  }

  if (normalized.includes("mime type") || normalized.includes("invalid file type")) {
    return "One or more files uses an unsupported image format.";
  }

  return "Unable to upload listing images right now. Please try again.";
}

export async function uploadListingImagesToStorage(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  images: ListingImageUploadInput[]
): Promise<{ data?: UploadedListingImage[]; error?: string }> {
  const uploadedPaths: string[] = [];
  const uploaded: UploadedListingImage[] = [];

  for (const image of images) {
    if (!isAcceptedImageType(image.file)) {
      await removeListingImagesFromStorage(supabase, uploadedPaths);
      return {
        error: "Only JPG, PNG, WEBP, and GIF images can be uploaded.",
      };
    }

    const storagePath = buildListingImageStoragePath(
      userId,
      listingId,
      image.name
    );

    const { error } = await supabase.storage
      .from(HORSE_IMAGES_BUCKET)
      .upload(storagePath, image.file, {
        contentType: image.type || image.file.type,
        upsert: false,
      });

    if (error) {
      await removeListingImagesFromStorage(supabase, uploadedPaths);
      console.error("[uploadListingImagesToStorage] failed", {
        message: error.message,
        code: error.statusCode,
        storagePath,
        userId,
        listingId,
      });
      return {
        error:
          process.env.NODE_ENV === "development"
            ? `Image upload failed: ${error.message} | path: ${storagePath} | user: ${userId}`
            : mapStorageUploadError(error.message),
      };
    }

    uploadedPaths.push(storagePath);

    const publicUrl = getHorseImagePublicUrl(supabase, storagePath);
    uploaded.push({
      storagePath,
      publicUrl,
      isCover: image.isCover,
      meta: {
        name: image.name,
        isCover: image.isCover,
        size: image.size,
        type: image.type || image.file.type,
        storagePath,
        publicUrl,
      },
    });
  }

  return { data: uploaded };
}

export async function removeListingImagesFromStorage(
  supabase: SupabaseClient,
  storagePaths: string[]
) {
  if (storagePaths.length === 0) return;

  await supabase.storage.from(HORSE_IMAGES_BUCKET).remove(storagePaths);
}

export async function removeAllListingImagesForListing(
  supabase: SupabaseClient,
  userId: string,
  listingId: string
) {
  const folderPath = `${userId}/${listingId}`;
  const { data: files, error } = await supabase.storage
    .from(HORSE_IMAGES_BUCKET)
    .list(folderPath);

  if (error || !files?.length) return;

  const paths = files.map((file) => `${folderPath}/${file.name}`);
  await supabase.storage.from(HORSE_IMAGES_BUCKET).remove(paths);
}

export function buildListingImageFields(uploaded: UploadedListingImage[]) {
  const imageUrls = uploaded.map((image) => image.publicUrl);
  const coverImage = uploaded.find((image) => image.isCover) ?? uploaded[0];

  return {
    image_urls: imageUrls,
    cover_image_url: coverImage?.publicUrl ?? null,
    images_meta: uploaded.map((image) => image.meta),
  };
}
