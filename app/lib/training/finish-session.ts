import type { SupabaseClient } from "@supabase/supabase-js";
import { publishHorseEvent } from "@/app/lib/events/event-service";
import { buildTrainingSessionCompletedEvent } from "@/app/lib/events/publishers";
import { defaultSessionTitle } from "@/app/lib/training/format";
import type { SessionReflectionInput } from "@/app/lib/training/session-lifecycle";

export type FinishTrainingSessionInput = SessionReflectionInput & {
  durationMinutes: number;
};

export type FinishTrainingSessionResult = {
  success?: boolean;
  error?: string;
};

export async function finishTrainingSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  input: FinishTrainingSessionInput
): Promise<FinishTrainingSessionResult> {
  const { data: session, error: fetchError } = await supabase
    .from("training_sessions")
    .select("id, status, pedigree_horse_id, session_date, title")
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
    return { success: true };
  }

  const { data: openExercises, error: exercisesError } = await supabase
    .from("training_session_exercises")
    .select("id, status")
    .eq("training_session_id", sessionId)
    .in("status", ["pending", "in_progress"]);

  if (exercisesError) {
    if (exercisesError.message.includes("status")) {
      return {
        error: "Session tracking columns are not available yet. Run migration 024 in Supabase.",
      };
    }
    return { error: exercisesError.message };
  }

  if ((openExercises ?? []).length > 0) {
    return { error: "Complete or skip every exercise before finishing the session." };
  }

  const durationMinutes = Math.max(1, Math.round(input.durationMinutes));

  const { error: updateError } = await supabase
    .from("training_sessions")
    .update({
      status: "completed",
      notes: input.notes?.trim() || null,
      coach_notes: input.coachNotes?.trim() || null,
      horse_feeling: input.horseFeeling?.trim() || null,
      rider_rating: input.riderRating,
      duration_minutes: durationMinutes,
    })
    .eq("id", sessionId)
    .eq("created_by", userId);

  if (updateError) {
    return { error: updateError.message };
  }

  const sessionDate = String(session.session_date);
  const sessionTitle =
    ((session.title as string | null | undefined)?.trim() || defaultSessionTitle(sessionDate));

  await publishHorseEvent(
    supabase,
    userId,
    buildTrainingSessionCompletedEvent(
      session.pedigree_horse_id as string,
      sessionId,
      sessionTitle
    )
  );

  return { success: true };
}
