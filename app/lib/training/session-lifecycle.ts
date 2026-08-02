import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrainingSessionDetail, TrainingSessionStatus } from "@/app/types/training";
import { defaultSessionTitle } from "@/app/lib/training/format";

const BASE_SESSION_SELECT =
  "id, status, session_date, title, session_goal, pedigree_horse_id, training_plan_id, notes, duration_minutes, pedigree_horses(name), training_plans(name)";

const EXTENDED_SESSION_SELECT = `${BASE_SESSION_SELECT}, rider_rating, horse_feeling, coach_notes, started_at`;

type SessionRow = Record<string, unknown>;

function isMissingColumnError(message: string): boolean {
  return (
    message.includes("rider_rating") ||
    message.includes("horse_feeling") ||
    message.includes("coach_notes") ||
    message.includes("started_at") ||
    message.includes("does not exist")
  );
}

function mapSessionRow(data: SessionRow): TrainingSessionDetail {
  const horse = data.pedigree_horses as { name?: string } | null;
  const plan = data.training_plans as { name?: string } | null;
  const sessionDate = String(data.session_date);

  return {
    id: data.id as string,
    status: data.status as TrainingSessionStatus,
    sessionDate,
    title: (data.title as string | null)?.trim() || defaultSessionTitle(sessionDate),
    sessionGoal: (data.session_goal as string | null | undefined) ?? null,
    pedigreeHorseId: data.pedigree_horse_id as string,
    horseName: horse?.name?.trim() || "Unknown horse",
    trainingPlanId: (data.training_plan_id as string | null | undefined) ?? null,
    trainingPlanName: plan?.name?.trim() || null,
    notes: (data.notes as string | null | undefined) ?? null,
    riderRating: (data.rider_rating as number | null | undefined) ?? null,
    horseFeeling: (data.horse_feeling as string | null | undefined) ?? null,
    coachNotes: (data.coach_notes as string | null | undefined) ?? null,
    durationMinutes: (data.duration_minutes as number | null | undefined) ?? null,
    startedAt: (data.started_at as string | null | undefined) ?? null,
  };
}

export async function fetchTrainingSessionDetail(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string
): Promise<{ session: TrainingSessionDetail | null; error?: string }> {
  let { data, error } = await supabase
    .from("training_sessions")
    .select(EXTENDED_SESSION_SELECT)
    .eq("id", sessionId)
    .eq("created_by", userId)
    .maybeSingle();

  if (error && isMissingColumnError(error.message)) {
    ({ data, error } = await supabase
      .from("training_sessions")
      .select(BASE_SESSION_SELECT)
      .eq("id", sessionId)
      .eq("created_by", userId)
      .maybeSingle());
  }

  if (error) {
    return { session: null, error: error.message };
  }

  if (!data) {
    return { session: null };
  }

  const session = mapSessionRow(data as SessionRow);

  if (session.trainingPlanId && !session.trainingPlanName) {
    const { data: planRow } = await supabase
      .from("training_plans")
      .select("name")
      .eq("id", session.trainingPlanId)
      .maybeSingle();

    session.trainingPlanName = (planRow?.name as string | null | undefined)?.trim() || null;
  }

  return { session };
}

export async function ensureSessionInProgress(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string
): Promise<{ startedAt: string | null; error?: string }> {
  let { data: session, error: fetchError } = await supabase
    .from("training_sessions")
    .select("id, status, started_at")
    .eq("id", sessionId)
    .eq("created_by", userId)
    .maybeSingle();

  if (fetchError && isMissingColumnError(fetchError.message)) {
    ({ data: session, error: fetchError } = await supabase
      .from("training_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .eq("created_by", userId)
      .maybeSingle());
  }

  if (fetchError) {
    return { startedAt: null, error: fetchError.message };
  }

  if (!session) {
    return { startedAt: null, error: "Training session not found." };
  }

  const existingStartedAt = (session.started_at as string | null | undefined) ?? null;

  if (session.status === "completed" || session.status === "cancelled") {
    return { startedAt: existingStartedAt };
  }

  const startedAt = existingStartedAt ?? new Date().toISOString();
  const needsUpdate = session.status !== "in_progress" || !existingStartedAt;

  if (!needsUpdate) {
    return { startedAt };
  }

  const updatePayload: Record<string, unknown> = { status: "in_progress" };
  if ("started_at" in session) {
    updatePayload.started_at = startedAt;
  }

  const { error: updateError } = await supabase
    .from("training_sessions")
    .update(updatePayload)
    .eq("id", sessionId)
    .eq("created_by", userId);

  if (updateError) {
    if (isMissingColumnError(updateError.message)) {
      const { error: statusOnlyError } = await supabase
        .from("training_sessions")
        .update({ status: "in_progress" })
        .eq("id", sessionId)
        .eq("created_by", userId);

      if (statusOnlyError) {
        return { startedAt: null, error: statusOnlyError.message };
      }

      return { startedAt: null };
    }

    return { startedAt: null, error: updateError.message };
  }

  return { startedAt: "started_at" in session ? startedAt : null };
}

export type SessionReflectionInput = {
  riderRating: number | null;
  horseFeeling: string | null;
  coachNotes: string | null;
  notes: string | null;
};

export async function saveSessionReflection(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  input: SessionReflectionInput
): Promise<{ error?: string }> {
  const { data: session, error: fetchError } = await supabase
    .from("training_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .eq("created_by", userId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!session) {
    return { error: "Training session not found." };
  }

  if (session.status === "completed") {
    return { error: "This session is already completed." };
  }

  const extendedPayload = {
    rider_rating: input.riderRating,
    horse_feeling: input.horseFeeling?.trim() || null,
    coach_notes: input.coachNotes?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  let { error: updateError } = await supabase
    .from("training_sessions")
    .update(extendedPayload)
    .eq("id", sessionId)
    .eq("created_by", userId);

  if (updateError && isMissingColumnError(updateError.message)) {
    ({ error: updateError } = await supabase
      .from("training_sessions")
      .update({ notes: input.notes?.trim() || null })
      .eq("id", sessionId)
      .eq("created_by", userId));
  }

  if (updateError) {
    return { error: updateError.message };
  }

  return {};
}
