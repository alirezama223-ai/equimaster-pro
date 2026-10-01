"use server";

import { createClient } from "@/app/lib/supabase/server";

export type ReminderRow = {
  id: string;
  horse_id: string | null;
  title: string;
  description: string | null;
  reminder_type: string;
  due_at: string;
  recurrence_rule: string | null;
  remind_before_minutes: number;
  status: string;
  enabled: boolean;
  auto_generated?: boolean;
  source_type?: string | null;
  source_id?: string | null;
  rule_key?: string | null;
};

export type ReminderHorseOption = { id: string; name: string };

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getMyReminders(): Promise<{
  reminders: ReminderRow[];
  horses: ReminderHorseOption[];
  error?: string;
}> {
  const { supabase, user } = await getUser();
  if (!user) return { reminders: [], horses: [], error: "You must be signed in." };

  const now = new Date().toISOString();
  const [{ data: reminders, error: reminderError }, { data: personalHorses, error: personalHorseError }, { data: listingHorses, error: listingHorseError }] = await Promise.all([
    supabase
      .from("reminders")
      .select("id, horse_id, title, description, reminder_type, due_at, recurrence_rule, remind_before_minutes, status, enabled, auto_generated, source_type, source_id, rule_key")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .eq("enabled", true)
      .gte("due_at", now)
      .order("due_at", { ascending: true }),
    supabase
      .from("personal_horses")
      .select("id, name")
      .eq("owner_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("horse_listings")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  if (reminderError) return { reminders: [], horses: [], error: "Unable to load reminders." };
  if (personalHorseError && listingHorseError) return { reminders: (reminders ?? []) as ReminderRow[], horses: [], error: "Unable to load your horses." };

  const horses = new Map<string, ReminderHorseOption>();
  for (const horse of personalHorses ?? []) horses.set(horse.id, horse as ReminderHorseOption);
  for (const horse of listingHorses ?? []) if (!horses.has(horse.id)) horses.set(horse.id, horse as ReminderHorseOption);

  return {
    reminders: (reminders ?? []) as ReminderRow[],
    horses: Array.from(horses.values()).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

const TYPES = new Set(["training", "vaccination", "dental", "farrier", "medication", "vet", "custom"]);
const ALLOWED_MINUTES = new Set([0, 5, 10, 30, 60, 1440, 2880, 10080, 43200]);
const RECURRENCE_RULES = new Set([
  "FREQ=DAILY", "FREQ=WEEKLY", "FREQ=WEEKLY;INTERVAL=2", "FREQ=WEEKLY;INTERVAL=4",
  "FREQ=WEEKLY;INTERVAL=6", "FREQ=MONTHLY", "FREQ=MONTHLY;INTERVAL=6", "FREQ=YEARLY",
]);

function validateInput(input: {
  title: string; description?: string; reminderType: string; dueAt: string; horseId?: string;
  remindBeforeMinutes: number; recurrenceRule?: string;
}) {
  const title = input.title.trim();
  if (!title || title.length > 120) return { error: "Title is required and must be 120 characters or fewer." };
  if (!TYPES.has(input.reminderType)) return { error: "Invalid reminder type." };
  if (!Number.isFinite(Date.parse(input.dueAt))) return { error: "Please choose a valid date and time." };
  if (!ALLOWED_MINUTES.has(input.remindBeforeMinutes)) return { error: "Invalid reminder lead time." };
  const recurrenceRule = input.recurrenceRule?.trim() || null;
  if (recurrenceRule && !RECURRENCE_RULES.has(recurrenceRule)) return { error: "Invalid recurrence rule." };
  return { title, recurrenceRule, horseId: input.horseId?.trim() || null };
}

async function validateHorse(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, horseId: string | null) {
  if (!horseId) return true;
  const [{ data: personalHorse, error: personalError }, { data: listingHorse, error: listingError }] = await Promise.all([
    supabase.from("personal_horses").select("id").eq("id", horseId).eq("owner_id", userId).maybeSingle(),
    supabase.from("horse_listings").select("id").eq("id", horseId).eq("user_id", userId).maybeSingle(),
  ]);
  return (!personalError && !!personalHorse) || (!listingError && !!listingHorse);
}

function formatDatabaseError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }) {
  const code = error.code ? ` [${error.code}]` : "";
  const message = error.message?.trim() || "Unknown database error.";
  return `Unable to create this reminder right now.${code} ${message}`;
}

export async function createReminder(input: {
  title: string; description?: string; reminderType: string; dueAt: string; horseId?: string;
  remindBeforeMinutes: number; recurrenceRule?: string;
}): Promise<{ ok?: true; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "You must be signed in." };
  const checked = validateInput(input);
  if ("error" in checked) return checked;
  if (!(await validateHorse(supabase, user.id, checked.horseId))) return { error: "The selected horse could not be found." };

  const payload = {
    user_id: user.id, horse_id: checked.horseId, title: checked.title,
    description: input.description?.trim() || null, reminder_type: input.reminderType,
    due_at: new Date(input.dueAt).toISOString(), recurrence_rule: checked.recurrenceRule,
    remind_before_minutes: input.remindBeforeMinutes, status: "pending", enabled: true,
  };
  const { error } = await supabase.from("reminders").insert(payload);
  if (error) {
    console.error("[EquiMaster reminders] createReminder insert failed", {
      code: error.code, message: error.message, details: error.details, hint: error.hint,
      reminderType: payload.reminder_type, hasHorse: Boolean(payload.horse_id), recurrenceRule: payload.recurrence_rule,
    });
    return { error: formatDatabaseError(error) };
  }
  return { ok: true };
}

export async function updateReminder(id: string, input: {
  title: string; description?: string; reminderType: string; dueAt: string; horseId?: string;
  remindBeforeMinutes: number; recurrenceRule?: string;
}): Promise<{ ok?: true; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "You must be signed in." };
  if (!id?.trim()) return { error: "Invalid reminder." };
  const checked = validateInput(input);
  if ("error" in checked) return checked;
  if (!(await validateHorse(supabase, user.id, checked.horseId))) return { error: "The selected horse could not be found." };

  const now = new Date().toISOString();
  const { error } = await supabase.from("reminders")
    .update({ horse_id: checked.horseId, title: checked.title, description: input.description?.trim() || null,
      reminder_type: input.reminderType, due_at: new Date(input.dueAt).toISOString(),
      recurrence_rule: checked.recurrenceRule, remind_before_minutes: input.remindBeforeMinutes,
      status: "pending", enabled: true, completed_at: null, dismissed_at: null, updated_at: now })
    .eq("id", id).eq("user_id", user.id);

  if (error) return { error: "Unable to update this reminder right now." };
  return { ok: true };
}

export async function cancelReminder(id: string): Promise<{ ok?: true; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "You must be signed in." };
  const { error } = await supabase.from("reminders").update({ status: "cancelled", enabled: false, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Unable to cancel this reminder right now." };
  return { ok: true };
}

export async function completeReminder(id: string): Promise<{ ok?: true; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "You must be signed in." };
  const now = new Date().toISOString();
  const { error } = await supabase.from("reminders").update({ status: "completed", enabled: false, completed_at: now, updated_at: now }).eq("id", id).eq("user_id", user.id).eq("status", "pending");
  if (error) return { error: "Unable to complete this reminder." };
  return { ok: true };
}