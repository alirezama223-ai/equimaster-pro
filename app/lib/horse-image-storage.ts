import type { SupabaseClient } from "@supabase/supabase-js";
import { isAcceptedImageType } from "@/app/lib/listing-validation";
import { MAX_LISTING_IMAGE_BYTES } from "@/app/types/listing";
import { HorseListingImageMeta } from "@/app/types/horse-listing";

export const HORSE_IMAGES_BUCKET = "horse-images";

export type SerializedUploadedListingImage = {
  storagePath: string;
  publicUrl: string;
  isCover: boolean;
  name: string;
  size: number;
  type: string;
};

export function isListingImageStoragePathOwnedByUser(
  storagePath: string,
  userId: string,
  listingId: string
): boolean {
  const prefix = `${userId}/${listingId}/`;
  return storagePath.startsWith(prefix) && !storagePath.includes("..");
}

export function serializedImagesToUploaded(
  images: SerializedUploadedListingImage[]
): UploadedListingImage[] {
  return images.map((image) => ({
    storagePath: image.storagePath,
    publicUrl: image.publicUrl,
    isCover: image.isCover,
    meta: {
      name: image.name,
      isCover: image.isCover,
      size: image.size,
      type: image.type,
      storagePath: image.storagePath,
      publicUrl: image.publicUrl,
    },
  }));
}

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

    if (image.file.size > MAX_LISTING_IMAGE_BYTES) {
      await removeListingImagesFromStorage(supabase, uploadedPaths);
      return {
        error: "One or more images exceed the 10 MB upload size limit.",
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

export async function copyListingImagesForDuplicate(
  supabase: SupabaseClient,
  userId: string,
  sourceListing: {
    images_meta: HorseListingImageMeta[];
    image_urls: string[];
    cover_image_url: string | null;
  },
  targetListingId: string
): Promise<{ data?: UploadedListingImage[]; error?: string }> {
  if (sourceListing.images_meta.length === 0 && sourceListing.image_urls.length === 0) {
    return { data: [] };
  }

  const uploaded: UploadedListingImage[] = [];
  const metas =
    sourceListing.images_meta.length > 0
      ? sourceListing.images_meta
      : sourceListing.image_urls.map((url, index) => ({
          name: `image-${index + 1}.jpg`,
          isCover: url === sourceListing.cover_image_url,
          size: 0,
          type: "image/jpeg",
          publicUrl: url,
          storagePath: extractHorseImageStoragePath(url) ?? undefined,
        }));

  for (const meta of metas) {
    const sourcePath =
      meta.storagePath ??
      (meta.publicUrl ? extractHorseImageStoragePath(meta.publicUrl) : null);

    if (!sourcePath) {
      continue;
    }

    const targetPath = buildListingImageStoragePath(userId, targetListingId, meta.name);
    const { error: copyError } = await supabase.storage
      .from(HORSE_IMAGES_BUCKET)
      .copy(sourcePath, targetPath);

    if (copyError) {
      console.error("[copyListingImagesForDuplicate] copy failed", copyError);
      return { error: mapStorageUploadError(copyError.message) };
    }

    const publicUrl = getHorseImagePublicUrl(supabase, targetPath);
    uploaded.push({
      storagePath: targetPath,
      publicUrl,
      isCover: meta.isCover,
      meta: {
        name: meta.name,
        isCover: meta.isCover,
        size: meta.size,
        type: meta.type,
        storagePath: targetPath,
        publicUrl,
      },
    });
  }

  if (uploaded.length === 0) {
    return { error: "Unable to duplicate listing images." };
  }

  if (!uploaded.some((image) => image.isCover)) {
    uploaded[0] = { ...uploaded[0], isCover: true, meta: { ...uploaded[0].meta, isCover: true } };
  }

  return { data: uploaded };
}
