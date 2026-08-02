import type { SupabaseClient } from "@supabase/supabase-js";

function isMissingColumnError(message: string): boolean {
  return (
    message.includes("started_at") ||
    message.includes("status") ||
    message.includes("execution_notes") ||
    message.includes("does not exist")
  );
}

export async function resetSessionExerciseTracking(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("training_session_exercises")
    .update({
      status: "pending",
      execution_notes: null,
    })
    .eq("training_session_id", sessionId);

  if (error) {
    if (isMissingColumnError(error.message)) {
      return {};
    }

    return { error: error.message };
  }

  return {};
}

export async function activateSessionForStart(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  previousStatus: string
): Promise<{ startedAt: string | null; error?: string }> {
  const startedAt = new Date().toISOString();
  const shouldResetExercises =
    previousStatus === "completed" ||
    previousStatus === "skipped" ||
    previousStatus === "cancelled";

  let { error: updateError } = await supabase
    .from("training_sessions")
    .update({
      status: "in_progress",
      started_at: startedAt,
    })
    .eq("id", sessionId)
    .eq("created_by", userId);

  if (updateError && isMissingColumnError(updateError.message)) {
    ({ error: updateError } = await supabase
      .from("training_sessions")
      .update({ status: "in_progress" })
      .eq("id", sessionId)
      .eq("created_by", userId));
  }

  if (updateError) {
    return { startedAt: null, error: updateError.message };
  }

  if (shouldResetExercises) {
    const resetResult = await resetSessionExerciseTracking(supabase, sessionId);
    if (resetResult.error) {
      return { startedAt, error: resetResult.error };
    }
  }

  return { startedAt };
}
