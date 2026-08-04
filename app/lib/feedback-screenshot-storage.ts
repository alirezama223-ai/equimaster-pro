import type { SupabaseClient } from "@supabase/supabase-js";
import { validateFeedbackScreenshot } from "@/app/lib/feedback/validation";

export const FEEDBACK_SCREENSHOTS_BUCKET = "feedback-screenshots";

function sanitizeExtension(fileName: string): string {
  const match = fileName.match(/(\.[a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? "";
}

export function buildFeedbackScreenshotStoragePath(
  userId: string,
  reportId: string,
  originalName: string
): string {
  const ext = sanitizeExtension(originalName);
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  return `${userId}/${reportId}/${uniqueName}`;
}

export function getFeedbackScreenshotPublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage
    .from(FEEDBACK_SCREENSHOTS_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export function mapFeedbackScreenshotUploadError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("bucket") && normalized.includes("not found")) {
    return "Screenshot storage is not configured. Run supabase/migrations/036_feedback_reports.sql in Supabase.";
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "You do not have permission to upload this screenshot.";
  }

  if (normalized.includes("payload too large") || normalized.includes("file size")) {
    return "Screenshot exceeds the upload size limit.";
  }

  if (normalized.includes("mime type") || normalized.includes("invalid file type")) {
    return "Screenshot uses an unsupported image format.";
  }

  return "Unable to upload screenshot right now. Please try again.";
}

export async function uploadFeedbackScreenshot(
  supabase: SupabaseClient,
  userId: string,
  reportId: string,
  file: File
): Promise<{ storagePath: string; publicUrl: string } | { error: string }> {
  const validationError = validateFeedbackScreenshot(file);
  if (validationError) {
    return { error: validationError };
  }

  const storagePath = buildFeedbackScreenshotStoragePath(userId, reportId, file.name);

  const { error } = await supabase.storage
    .from(FEEDBACK_SCREENSHOTS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { error: mapFeedbackScreenshotUploadError(error.message) };
  }

  return {
    storagePath,
    publicUrl: getFeedbackScreenshotPublicUrl(supabase, storagePath),
  };
}
