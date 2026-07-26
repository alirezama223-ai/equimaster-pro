import type { SupabaseClient } from "@supabase/supabase-js";
import { isAcceptedImageType } from "@/app/lib/listing-validation";

export const STALLION_IMAGES_BUCKET = "stallion-images";
export const MAX_STALLION_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_STALLION_IMAGES = 12;

export type StallionImageUploadInput = {
  file: File;
  isCover: boolean;
  name: string;
  type: string;
  size: number;
};

export type UploadedStallionImage = {
  storagePath: string;
  publicUrl: string;
  isCover: boolean;
};

function sanitizeExtension(fileName: string): string {
  const match = fileName.match(/(\.[a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? "";
}

export function extractStallionImageStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${STALLION_IMAGES_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

export function isOwnedStallionStoragePath(storagePath: string, userId: string): boolean {
  const normalized = storagePath.trim();
  if (!normalized) return false;
  return normalized.startsWith(`${userId}/`);
}

export function resolveOwnedStallionStoragePath(
  publicUrl: string | null | undefined,
  userId: string
): string | null {
  if (!publicUrl?.trim()) return null;
  const storagePath = extractStallionImageStoragePath(publicUrl.trim());
  if (!storagePath || !isOwnedStallionStoragePath(storagePath, userId)) {
    return null;
  }
  return storagePath;
}

export function buildStallionImageStoragePath(
  userId: string,
  stallionId: string,
  originalName: string
): string {
  const ext = sanitizeExtension(originalName);
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  return `${userId}/${stallionId}/${uniqueName}`;
}

export function getStallionImagePublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage.from(STALLION_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export function validateStallionImageFile(file: File): string | null {
  if (!isAcceptedImageType(file)) {
    return "Only JPG, PNG, WEBP, and GIF images can be uploaded.";
  }

  if (file.size > MAX_STALLION_IMAGE_BYTES) {
    return "Each image must be 10 MB or smaller.";
  }

  return null;
}

export function mapStallionStorageUploadError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("bucket") && normalized.includes("not found")) {
    return "Stallion image storage is not configured. Run supabase/migrations/010_stallion_breeder_storage.sql in Supabase.";
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "You do not have permission to upload stallion images.";
  }

  if (normalized.includes("payload too large") || normalized.includes("file size")) {
    return "One or more images exceed the 10 MB upload limit.";
  }

  if (normalized.includes("mime type") || normalized.includes("invalid file type")) {
    return "One or more files use an unsupported image format.";
  }

  return "Unable to upload stallion images right now. Please try again.";
}

export async function uploadStallionImagesToStorage(
  supabase: SupabaseClient,
  userId: string,
  stallionId: string,
  images: StallionImageUploadInput[]
): Promise<{ data?: UploadedStallionImage[]; error?: string }> {
  const uploadedPaths: string[] = [];
  const uploaded: UploadedStallionImage[] = [];

  for (const image of images) {
    const validationError = validateStallionImageFile(image.file);
    if (validationError) {
      await removeStallionImagesFromStorage(supabase, uploadedPaths, userId);
      return { error: validationError };
    }

    const storagePath = buildStallionImageStoragePath(userId, stallionId, image.name);

    const { error } = await supabase.storage.from(STALLION_IMAGES_BUCKET).upload(storagePath, image.file, {
      contentType: image.type || image.file.type,
      upsert: false,
    });

    if (error) {
      await removeStallionImagesFromStorage(supabase, uploadedPaths, userId);
      console.error("[uploadStallionImagesToStorage] failed", {
        message: error.message,
        storagePath,
        userId,
        stallionId,
      });
      return {
        error:
          process.env.NODE_ENV === "development"
            ? `Image upload failed: ${error.message} | path: ${storagePath}`
            : mapStallionStorageUploadError(error.message),
      };
    }

    uploadedPaths.push(storagePath);
    uploaded.push({
      storagePath,
      publicUrl: getStallionImagePublicUrl(supabase, storagePath),
      isCover: image.isCover,
    });
  }

  return { data: uploaded };
}

export async function removeStallionImagesFromStorage(
  supabase: SupabaseClient,
  storagePaths: string[],
  userId: string
) {
  const ownedPaths = storagePaths.filter(
    (path) => isOwnedStallionStoragePath(path, userId) && path.trim().length > 0
  );

  if (ownedPaths.length === 0) return;

  await supabase.storage.from(STALLION_IMAGES_BUCKET).remove(ownedPaths);
}

export async function removeAllStallionImagesForStallion(
  supabase: SupabaseClient,
  userId: string,
  stallionId: string
) {
  const folderPath = `${userId}/${stallionId}`;
  const { data: files, error } = await supabase.storage.from(STALLION_IMAGES_BUCKET).list(folderPath);

  if (error || !files?.length) return;

  const paths = files.map((file) => `${folderPath}/${file.name}`);
  await removeStallionImagesFromStorage(supabase, paths, userId);
}

export function buildStallionImageFields(uploaded: Pick<UploadedStallionImage, "publicUrl" | "isCover">[]) {
  const imageUrls = uploaded.map((image) => image.publicUrl);
  const coverImage = uploaded.find((image) => image.isCover) ?? uploaded[0];

  return {
    image_urls: imageUrls,
    cover_image_url: coverImage?.publicUrl ?? null,
  };
}

export function filterOwnedRemovedPaths(paths: string[], userId: string): string[] {
  return paths.filter((path) => isOwnedStallionStoragePath(path, userId));
}

export function collectOwnedStallionImagePathsFromRow(
  row: { image_urls?: unknown; cover_image_url?: string | null },
  userId: string
): string[] {
  const urls = new Set<string>();

  if (Array.isArray(row.image_urls)) {
    for (const value of row.image_urls) {
      if (typeof value === "string" && value.trim()) {
        urls.add(value.trim());
      }
    }
  }

  if (row.cover_image_url?.trim()) {
    urls.add(row.cover_image_url.trim());
  }

  const paths = new Set<string>();
  for (const url of urls) {
    const storagePath = resolveOwnedStallionStoragePath(url, userId);
    if (storagePath) {
      paths.add(storagePath);
    }
  }

  return [...paths];
}
