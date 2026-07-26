import type { SupabaseClient } from "@supabase/supabase-js";
import { isAcceptedImageType } from "@/app/lib/listing-validation";

export const BREEDER_IMAGES_BUCKET = "breeder-images";
export const MAX_BREEDER_IMAGE_BYTES = 10 * 1024 * 1024;

export type BreederImageKind = "logo" | "cover";

function sanitizeExtension(fileName: string): string {
  const match = fileName.match(/(\.[a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? "";
}

export function extractBreederImageStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BREEDER_IMAGES_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

export function isOwnedBreederStoragePath(storagePath: string, userId: string): boolean {
  const normalized = storagePath.trim();
  if (!normalized) return false;
  return normalized.startsWith(`${userId}/`);
}

export function buildBreederImageStoragePath(
  userId: string,
  breederId: string,
  kind: BreederImageKind,
  originalName: string
): string {
  const ext = sanitizeExtension(originalName);
  const uniqueName = `${kind}-${Date.now()}-${crypto.randomUUID()}${ext}`;
  return `${userId}/${breederId}/${uniqueName}`;
}

export function getBreederImagePublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage.from(BREEDER_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export function validateBreederImageFile(file: File): string | null {
  if (!isAcceptedImageType(file)) {
    return "Only JPG, PNG, WEBP, and GIF images can be uploaded.";
  }

  if (file.size > MAX_BREEDER_IMAGE_BYTES) {
    return "Each image must be 10 MB or smaller.";
  }

  return null;
}

export function mapBreederStorageUploadError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("bucket") && normalized.includes("not found")) {
    return "Breeder image storage is not configured. Run supabase/migrations/010_stallion_breeder_storage.sql in Supabase.";
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "You do not have permission to upload stud farm images.";
  }

  if (normalized.includes("payload too large") || normalized.includes("file size")) {
    return "The selected image exceeds the 10 MB upload limit.";
  }

  if (normalized.includes("mime type") || normalized.includes("invalid file type")) {
    return "The selected file uses an unsupported image format.";
  }

  return "Unable to upload stud farm images right now. Please try again.";
}

export async function uploadBreederImageToStorage(
  supabase: SupabaseClient,
  userId: string,
  breederId: string,
  kind: BreederImageKind,
  file: File
): Promise<{ data?: { storagePath: string; publicUrl: string }; error?: string }> {
  const validationError = validateBreederImageFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const storagePath = buildBreederImageStoragePath(userId, breederId, kind, file.name);

  const { error } = await supabase.storage.from(BREEDER_IMAGES_BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("[uploadBreederImageToStorage] failed", {
      message: error.message,
      storagePath,
      userId,
      breederId,
      kind,
    });
    return {
      error:
        process.env.NODE_ENV === "development"
          ? `Image upload failed: ${error.message} | path: ${storagePath}`
          : mapBreederStorageUploadError(error.message),
    };
  }

  return {
    data: {
      storagePath,
      publicUrl: getBreederImagePublicUrl(supabase, storagePath),
    },
  };
}

export async function removeBreederImagesFromStorage(
  supabase: SupabaseClient,
  storagePaths: string[],
  userId: string
) {
  const ownedPaths = storagePaths.filter(
    (path) => isOwnedBreederStoragePath(path, userId) && path.trim().length > 0
  );

  if (ownedPaths.length === 0) return;

  await supabase.storage.from(BREEDER_IMAGES_BUCKET).remove(ownedPaths);
}

export async function removeAllBreederImagesForProfile(
  supabase: SupabaseClient,
  userId: string,
  breederId: string
) {
  const folderPath = `${userId}/${breederId}`;
  const { data: files, error } = await supabase.storage
    .from(BREEDER_IMAGES_BUCKET)
    .list(folderPath);

  if (error || !files?.length) return;

  const paths = files.map((file) => `${folderPath}/${file.name}`);
  await removeBreederImagesFromStorage(supabase, paths, userId);
}

export function resolveOwnedStoragePath(
  publicUrl: string | null | undefined,
  userId: string
): string | null {
  if (!publicUrl?.trim()) return null;
  const storagePath = extractBreederImageStoragePath(publicUrl.trim());
  if (!storagePath || !isOwnedBreederStoragePath(storagePath, userId)) {
    return null;
  }
  return storagePath;
}
