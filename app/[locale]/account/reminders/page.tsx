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
  const horseNames = new Map(result.horses.map((horse) => [horse.id, horse.name]));
  const reminders = result.reminders.map((reminder) => {
    // Vaccination reminders can come from either the newer source metadata
    // or older rows that only carry the reminder type. Legacy rows may have
    // the vaccine name in description rather than rule_key.
    const isVaccination = reminder.source_type === "vaccination" || reminder.reminder_type === "vaccination";
    if (!isVaccination) return reminder;

    const horseName = reminder.horse_id ? horseNames.get(reminder.horse_id) : undefined;
    const vaccineName = reminder.rule_key?.trim() || reminder.description?.trim() || "Vaccination";

    return {
      ...reminder,
      title: horseName ? `${vaccineName} vaccination · ${horseName}` : `${vaccineName} vaccination`,
    };
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeUp immediate>
            <RemindersManager reminders={reminders} horses={result.horses} />
          </FadeUp>
        </div>
      </main>
    </>
  );
}
