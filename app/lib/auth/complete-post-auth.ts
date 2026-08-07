import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppLocale } from "@/i18n/routing";
import { navigateToProtectedRoute } from "@/app/lib/auth/navigate-protected";
import { waitForAuthSession } from "@/app/lib/auth/redirect";

export async function completePostAuthRedirect(
  supabase: SupabaseClient,
  nextPath: string,
  locale: AppLocale
): Promise<boolean> {
  const sessionReady = await waitForAuthSession(supabase);

  if (!sessionReady) {
    return false;
  }

  const result = await navigateToProtectedRoute({
    path: nextPath,
    locale,
    isAuthenticated: true,
    currentPathname: window.location.pathname,
    waitForSession: false,
    supabase,
  });

  return result === "navigated" || result === "noop";
}
