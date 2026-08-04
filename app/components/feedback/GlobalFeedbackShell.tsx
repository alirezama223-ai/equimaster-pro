import { createClient } from "@/app/lib/supabase/server";
import FeedbackWidget from "@/app/components/feedback/FeedbackWidget";

export default async function GlobalFeedbackShell() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <FeedbackWidget isAuthenticated={Boolean(user)} />;
}
