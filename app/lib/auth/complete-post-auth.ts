import type { SupabaseClient } from "@supabase/supabase-js";
import { getRouterPushPath, waitForAuthSession } from "@/app/lib/auth/redirect";

type AuthRouter = {
  push: (href: string) => void;
  refresh: () => void;
};

export async function completePostAuthRedirect(
  supabase: SupabaseClient,
  router: AuthRouter,
  nextPath: string
): Promise<boolean> {
  const sessionReady = await waitForAuthSession(supabase);

  if (!sessionReady) {
    return false;
  }

  const targetPath = getRouterPushPath(nextPath);

  // Push first so the i18n router adds the locale exactly once.
  // Refreshing on /login would race with middleware and can double-prefix locales.
  router.push(targetPath);
  router.refresh();
  return true;
}
