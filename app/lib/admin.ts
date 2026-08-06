import { createClient } from "@/app/lib/supabase/server";
import { getProfileForUser, isAdminRole } from "@/app/lib/profiles";
export { formatOwnerReference } from "@/app/lib/format-owner-reference";

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const profile = await getProfileForUser(supabase, user.id);
  return isAdminRole(profile?.role);
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: "You must be signed in." as const,
      user: null,
      supabase: null,
    };
  }

  const profile = await getProfileForUser(supabase, user.id);

  if (!isAdminRole(profile?.role)) {
    return {
      error: "You do not have permission to perform this action." as const,
      user: null,
      supabase: null,
    };
  }

  return {
    error: null,
    user,
    supabase,
  };
}

export type AdminVerificationFilter = "all" | "verified" | "pending";

export function matchesVerificationFilter(
  verified: boolean,
  filter: AdminVerificationFilter
): boolean {
  if (filter === "verified") {
    return verified;
  }

  if (filter === "pending") {
    return !verified;
  }

  return true;
}
