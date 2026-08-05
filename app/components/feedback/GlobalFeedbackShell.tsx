import { createClient } from "@/app/lib/supabase/server";
import LazyFeedbackWidget from "@/app/components/feedback/LazyFeedbackWidget";

export default async function GlobalFeedbackShell() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LazyFeedbackWidget isAuthenticated={Boolean(user)} />;
}
