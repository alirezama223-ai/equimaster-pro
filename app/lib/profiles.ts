import type { SupabaseClient } from "@supabase/supabase-js";
import { ProfileRow, UserRole } from "@/app/types/profile";

export function rowToProfile(row: Record<string, unknown>): ProfileRow {
  const documents = row.seller_verification_documents;
  return {
    user_id: String(row.user_id),
    role: row.role === "admin" ? "admin" : "user",
    seller_verified: Boolean(row.seller_verified),
    account_status:
      row.account_status === "suspended" || row.account_status === "banned"
        ? row.account_status
        : "active",
    country: row.country ? String(row.country) : null,
    seller_verification_status:
      row.seller_verification_status === "pending" ||
      row.seller_verification_status === "verified" ||
      row.seller_verification_status === "rejected"
        ? row.seller_verification_status
        : "unverified",
    seller_verification_documents: Array.isArray(documents)
      ? documents.map((doc) => ({
          name: String((doc as { name?: string }).name ?? "Document"),
          url: String((doc as { url?: string }).url ?? ""),
          uploadedAt: (doc as { uploadedAt?: string }).uploadedAt,
        }))
      : [],
    seller_verification_notes: row.seller_verification_notes
      ? String(row.seller_verification_notes)
      : null,
    phone_verified: Boolean(row.phone_verified),
    seller_rejection_reason: row.seller_rejection_reason
      ? String(row.seller_rejection_reason)
      : null,
    seller_verified_at: row.seller_verified_at ? String(row.seller_verified_at) : null,
    seller_verified_by: row.seller_verified_by ? String(row.seller_verified_by) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getProfileForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "user_id, role, seller_verified, account_status, country, seller_verification_status, seller_verification_documents, seller_verification_notes, phone_verified, seller_rejection_reason, seller_verified_at, seller_verified_by, created_at, updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return rowToProfile(data as Record<string, unknown>);
}

export function isAdminRole(role: UserRole | string | null | undefined): boolean {
  return role === "admin";
}
