import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppLocale } from "@/i18n/routing";
import { localizePath } from "@/i18n/path";
import { getRouterPushPath, waitForAuthSession } from "@/app/lib/auth/redirect";

export async function completePostAuthRedirect(
  supabase: SupabaseClient,
  nextPath: string,
  locale: AppLocale
): Promise<boolean> {
  const sessionReady = await waitForAuthSession(supabase);

  if (!sessionReady) {
    return false;
  }

  const targetPath = localizePath(getRouterPushPath(nextPath), locale);

  // Full document navigation avoids Mobile Safari cookie/middleware redirect loops
  // that client-side router.push + refresh can trigger before cookies are visible.
  window.location.replace(targetPath);
  return true;
}
