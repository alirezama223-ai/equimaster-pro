import type { VaccinationSchedule } from "@/app/lib/vaccination-rules";

export async function upsertVaccinationReminder(supabase: any, input: {
  userId: string;
  horseId: string;
  horseName: string;
  vaccinationId: string;
  vaccineName: string;
  dueDate: string;
  schedule?: VaccinationSchedule | null;
}) {
  if (!input.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) return;

  const ruleKey = input.schedule?.ruleKey ?? "manual_due_date";
  const reason = input.schedule?.reason ?? "The next due date was entered explicitly in the horse passport or vaccination record.";
  const title = `Vaccination due · ${input.horseName}`;
  const description = `${input.vaccineName} · due ${input.dueDate}. ${reason}`;
  const dueAt = new Date(`${input.dueDate}T09:00:00Z`).toISOString();

  const { data: existing } = await supabase
    .from("reminders")
    .select("id")
    .eq("user_id", input.userId)
    .eq("source_type", "horse_vaccination")
    .eq("source_id", input.vaccinationId)
    .eq("auto_generated", true)
    .maybeSingle();

  const payload = {
    user_id: input.userId,
    horse_id: input.horseId,
    title,
    description,
    reminder_type: "vaccination",
    due_at: dueAt,
    recurrence_rule: null,
    remind_before_minutes: 43200,
    status: "pending",
    enabled: true,
    source_type: "horse_vaccination",
    source_id: input.vaccinationId,
    auto_generated: true,
    rule_key: ruleKey,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await supabase.from("reminders").update(payload).eq("id", existing.id).eq("user_id", input.userId);
  } else {
    await supabase.from("reminders").insert(payload);
  }
}
