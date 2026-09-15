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

  const [{ data: reminders, error: reminderError }, { data: horses, error: horseError }] = await Promise.all([
    supabase
      .from("reminders")
      .select("id, horse_id, title, description, reminder_type, due_at, recurrence_rule, remind_before_minutes, status, enabled")
      .eq("user_id", user.id)
      .order("due_at", { ascending: true }),
    supabase
      .from("horse_listings")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  if (reminderError) return { reminders: [], horses: (horses ?? []) as ReminderHorseOption[], error: "Unable to load reminders." };
  if (horseError) return { reminders: (reminders ?? []) as ReminderRow[], horses: [], error: "Unable to load your horses." };

  return {
    reminders: (reminders ?? []) as ReminderRow[],
    horses: (horses ?? []) as ReminderHorseOption[],
  };
}

const TYPES = new Set(["training", "vaccination", "dental", "farrier", "medication", "vet", "custom"]);
const ALLOWED_MINUTES = new Set([0, 5, 10, 30, 60, 1440, 2880]);
const RECURRENCE_RULES = new Set([
  "FREQ=DAILY",
  "FREQ=WEEKLY",
  "FREQ=WEEKLY;INTERVAL=2",
  "FREQ=WEEKLY;INTERVAL=4",
  "FREQ=WEEKLY;INTERVAL=6",
  "FREQ=MONTHLY",
  "FREQ=MONTHLY;INTERVAL=6",
  "FREQ=YEARLY",
]);

export async function createReminder(input: {
  title: string;
  description?: string;
  reminderType: string;
  dueAt: string;
  horseId?: string;
  remindBeforeMinutes: number;
  recurrenceRule?: string;
}): Promise<{ ok?: true; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "You must be signed in." };

  const title = input.title.trim();
  if (!title || title.length > 120) return { error: "Title is required and must be 120 characters or fewer." };
  if (!TYPES.has(input.reminderType)) return { error: "Invalid reminder type." };
  if (!Number.isFinite(Date.parse(input.dueAt))) return { error: "Please choose a valid date and time." };
  if (!ALLOWED_MINUTES.has(input.remindBeforeMinutes)) return { error: "Invalid reminder lead time." };

  const recurrenceRule = input.recurrenceRule?.trim() || null;
  if (recurrenceRule && !RECURRENCE_RULES.has(recurrenceRule)) return { error: "Invalid recurrence rule." };

  const horseId = input.horseId?.trim() || null;
  if (horseId) {
    const { data: horse, error: horseError } = await supabase
      .from("horse_listings")
      .select("id")
      .eq("id", horseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (horseError || !horse) return { error: "The selected horse could not be found." };
  }

  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    horse_id: horseId,
    title,
    description: input.description?.trim() || null,
    reminder_type: input.reminderType,
    due_at: new Date(input.dueAt).toISOString(),
    recurrence_rule: recurrenceRule,
    remind_before_minutes: input.remindBeforeMinutes,
    status: "pending",
    enabled: true,
  });

  if (error) return { error: "Unable to create this reminder right now." };
  return { ok: true };
}

export async function cancelReminder(id: string): Promise<{ ok?: true; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("reminders")
    .update({ status: "cancelled", enabled: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Unable to cancel this reminder." };
  return { ok: true };
}

export async function completeReminder(id: string): Promise<{ ok?: true; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "You must be signed in." };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("reminders")
    .update({ status: "completed", enabled: false, completed_at: now, updated_at: now })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) return { error: "Unable to complete this reminder." };
  return { ok: true };
}
