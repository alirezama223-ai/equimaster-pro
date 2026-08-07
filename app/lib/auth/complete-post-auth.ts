import type { SupabaseClient } from "@supabase/supabase-js";
import { getSafeNextPath } from "@/app/lib/auth/paths";
import { waitForAuthSession } from "@/app/lib/auth/redirect";

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

  router.refresh();
  router.push(getSafeNextPath(nextPath));
  return true;
}
