import type { SupabaseClient } from "@supabase/supabase-js";
import { ProfileRow, UserRole } from "@/app/types/profile";

export function rowToProfile(row: Record<string, unknown>): ProfileRow {
  return {
    user_id: String(row.user_id),
    role: row.role === "admin" ? "admin" : "user",
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
    .select("user_id, role, created_at, updated_at")
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
