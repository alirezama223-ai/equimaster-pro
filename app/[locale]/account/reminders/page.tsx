import { redirect } from "next/navigation";
import { getMyReminders } from "@/app/actions/reminders";
import RemindersManager from "@/app/components/account/RemindersManager";
import Navbar from "@/app/components/navbar/Navbar";
import FadeUp from "@/app/components/animations/FadeUp";
import { createClient } from "@/app/lib/supabase/server";
import { loginRedirectPath } from "@/app/lib/auth/paths";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(loginRedirectPath("/account/reminders"));

  const result = await getMyReminders();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeUp immediate>
            <RemindersManager reminders={result.reminders} horses={result.horses} />
          </FadeUp>
        </div>
      </main>
    </>
  );
}
