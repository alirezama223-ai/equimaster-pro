import type { SupabaseClient } from "@supabase/supabase-js";
import type { VerificationDocumentType, VerificationSubjectType } from "@/app/types/verification";

export const VERIFICATION_DOCUMENTS_BUCKET = "verification-documents";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeExtension(fileName: string): string {
  const match = fileName.match(/(\.[a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? "";
}

export function validateVerificationDocumentFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Unsupported file type. Upload JPEG, PNG, WebP, or PDF.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File exceeds the 10 MB upload limit.";
  }

  return null;
}

export function buildVerificationStoragePath(
  userId: string,
  subjectType: VerificationSubjectType extends "document" ? never : VerificationSubjectType,
  documentType: VerificationDocumentType,
  originalName: string,
  horseListingId?: string | null
): string {
  const ext = sanitizeExtension(originalName);
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;

  if (subjectType === "horse" && horseListingId) {
    return `${userId}/horse/${horseListingId}/${documentType}/${uniqueName}`;
  }

  return `${userId}/seller/${documentType}/${uniqueName}`;
}

export function mapVerificationUploadError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("bucket") && normalized.includes("not found")) {
    return "Verification storage is not configured. Run supabase/migrations/042_verification_system.sql.";
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "You do not have permission to upload this document.";
  }

  if (normalized.includes("payload too large") || normalized.includes("file size")) {
    return "Document exceeds the upload size limit.";
  }

  if (normalized.includes("mime type") || normalized.includes("invalid file type")) {
    return "Document uses an unsupported file format.";
  }

  return "Unable to upload document right now. Please try again.";
}

export async function uploadVerificationDocument(
  supabase: SupabaseClient,
  userId: string,
  subjectType: "seller" | "horse",
  documentType: VerificationDocumentType,
  file: File,
  horseListingId?: string | null
): Promise<{ storagePath: string } | { error: string }> {
  const validationError = validateVerificationDocumentFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const storagePath = buildVerificationStoragePath(
    userId,
    subjectType,
    documentType,
    file.name,
    horseListingId
  );

  const { error } = await supabase.storage
    .from(VERIFICATION_DOCUMENTS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { error: mapVerificationUploadError(error.message) };
  }

  return { storagePath };
}

export async function createVerificationSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 300
): Promise<{ signedUrl: string } | { error: string }> {
  const { data, error } = await supabase.storage
    .from(VERIFICATION_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? "Unable to create signed URL." };
  }

  return { signedUrl: data.signedUrl };
}

export async function deleteVerificationStorageObject(
  supabase: SupabaseClient,
  storagePath: string
): Promise<{ error?: string }> {
  const { error } = await supabase.storage
    .from(VERIFICATION_DOCUMENTS_BUCKET)
    .remove([storagePath]);

  if (error) {
    return { error: error.message };
  }

  return {};
}
