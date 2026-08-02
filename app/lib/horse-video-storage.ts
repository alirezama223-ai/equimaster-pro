import type { SupabaseClient } from "@supabase/supabase-js";

export const HORSE_VIDEOS_BUCKET = "horse-videos";

export function extractHorseVideoStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${HORSE_VIDEOS_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

/** 100 MB — must match supabase/migrations/004_horse_videos_storage.sql */
export const MAX_LISTING_VIDEO_BYTES = 100 * 1024 * 1024;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export type UploadedListingVideo = {
  storagePath: string;
  publicUrl: string;
  fileName: string;
};

function sanitizeExtension(fileName: string): string {
  const match = fileName.match(/(\.[a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? "";
}

export function buildListingVideoStoragePath(
  userId: string,
  listingId: string,
  originalName: string
): string {
  const ext = sanitizeExtension(originalName);
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  return `${userId}/${listingId}/${uniqueName}`;
}

export function getHorseVideoPublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage
    .from(HORSE_VIDEOS_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export function isAcceptedVideoType(file: File): boolean {
  if (ACCEPTED_VIDEO_TYPES.includes(file.type as (typeof ACCEPTED_VIDEO_TYPES)[number])) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".mp4") || lowerName.endsWith(".webm") || lowerName.endsWith(".mov");
}

export function validateListingVideoFile(file: File): string | null {
  if (!isAcceptedVideoType(file)) {
    return "Only MP4, WebM, and MOV videos are allowed.";
  }

  if (file.size > MAX_LISTING_VIDEO_BYTES) {
    return "Video must be 100 MB or smaller.";
  }

  if (file.size === 0) {
    return "The selected video file is empty.";
  }

  return null;
}

export function mapVideoStorageUploadError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("bucket") && normalized.includes("not found")) {
    return "Video storage is not configured. Run supabase/migrations/004_horse_videos_storage.sql in Supabase.";
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "You do not have permission to upload listing videos.";
  }

  if (normalized.includes("payload too large") || normalized.includes("file size")) {
    return "Video exceeds the 100 MB upload limit.";
  }

  if (normalized.includes("mime type") || normalized.includes("invalid file type")) {
    return "This video format is not supported. Use MP4, WebM, or MOV.";
  }

  return "Unable to upload listing video right now. Please try again.";
}

export async function uploadListingVideoToStorage(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  file: File
): Promise<{ data?: UploadedListingVideo; error?: string }> {
  const validationError = validateListingVideoFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const storagePath = buildListingVideoStoragePath(userId, listingId, file.name);

  const { error } = await supabase.storage
    .from(HORSE_VIDEOS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "video/mp4",
      upsert: false,
    });

  if (error) {
    console.error("[uploadListingVideoToStorage] failed", {
      message: error.message,
      storagePath,
      userId,
      listingId,
    });

    return {
      error:
        process.env.NODE_ENV === "development"
          ? `Video upload failed: ${error.message} | path: ${storagePath} | user: ${userId}`
          : mapVideoStorageUploadError(error.message),
    };
  }

  return {
    data: {
      storagePath,
      publicUrl: getHorseVideoPublicUrl(supabase, storagePath),
      fileName: file.name,
    },
  };
}

export async function removeListingVideoFromStorage(
  supabase: SupabaseClient,
  storagePath: string
) {
  await supabase.storage.from(HORSE_VIDEOS_BUCKET).remove([storagePath]);
}

export async function removeAllListingVideosForListing(
  supabase: SupabaseClient,
  userId: string,
  listingId: string
) {
  const folderPath = `${userId}/${listingId}`;
  const { data: files, error } = await supabase.storage
    .from(HORSE_VIDEOS_BUCKET)
    .list(folderPath);

  if (error || !files?.length) return;

  const paths = files.map((file) => `${folderPath}/${file.name}`);
  await supabase.storage.from(HORSE_VIDEOS_BUCKET).remove(paths);
}

export function isDirectPlayableVideoUrl(url: string): boolean {
  if (!url) return false;

  const lower = url.toLowerCase();

  if (lower.includes("/storage/v1/object/public/horse-videos/")) {
    return true;
  }

  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov")
  );
}

export async function copyListingVideoForDuplicate(
  supabase: SupabaseClient,
  userId: string,
  sourceListing: {
    video_url: string | null;
    video_file_name: string | null;
  },
  targetListingId: string
): Promise<{ video_url: string | null; video_file_name: string | null; error?: string }> {
  if (!sourceListing.video_url) {
    return { video_url: null, video_file_name: null };
  }

  const sourcePath = extractHorseVideoStoragePath(sourceListing.video_url);
  if (!sourcePath) {
    return {
      video_url: sourceListing.video_url,
      video_file_name: sourceListing.video_file_name,
    };
  }

  const fileName = sourceListing.video_file_name ?? "video.mp4";
  const targetPath = buildListingVideoStoragePath(userId, targetListingId, fileName);
  const { error } = await supabase.storage
    .from(HORSE_VIDEOS_BUCKET)
    .copy(sourcePath, targetPath);

  if (error) {
    return { video_url: null, video_file_name: null, error: error.message };
  }

  return {
    video_url: getHorseVideoPublicUrl(supabase, targetPath),
    video_file_name: fileName,
  };
}
