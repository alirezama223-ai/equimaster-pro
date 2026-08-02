import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TrainingSessionExercise,
  TrainingSessionExerciseStatus,
} from "@/app/types/training";

const BASE_EXERCISE_SELECT =
  "id, sort_order, duration_minutes, notes, exercises(name, category)";

const EXTENDED_EXERCISE_SELECT = `${BASE_EXERCISE_SELECT}, status, execution_notes`;

function isMissingTrackingColumnError(message: string): boolean {
  return (
    message.includes("status") ||
    message.includes("execution_notes") ||
    message.includes("does not exist")
  );
}

export async function fetchSessionExercises(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ exercises: TrainingSessionExercise[]; error?: string }> {
  const extendedResult = await supabase
    .from("training_session_exercises")
    .select(EXTENDED_EXERCISE_SELECT)
    .eq("training_session_id", sessionId)
    .order("sort_order", { ascending: true });

  let rows: Record<string, unknown>[] = (extendedResult.data ?? []) as Record<string, unknown>[];
  let fetchError = extendedResult.error;
  let trackingEnabled = true;

  if (fetchError && isMissingTrackingColumnError(fetchError.message)) {
    trackingEnabled = false;
    const fallback = await supabase
      .from("training_session_exercises")
      .select(BASE_EXERCISE_SELECT)
      .eq("training_session_id", sessionId)
      .order("sort_order", { ascending: true });
    rows = (fallback.data ?? []) as Record<string, unknown>[];
    fetchError = fallback.error;
  }

  if (fetchError) {
    return { exercises: [], error: fetchError.message };
  }

  const exercises = rows.map((row) => {
    const exercise = row.exercises as { name?: string; category?: string } | null;
    return {
      id: row.id as string,
      label: exercise?.name?.trim() || "Untitled exercise",
      category: exercise?.category?.trim() || null,
      sortOrder: row.sort_order as number,
      durationMinutes: (row.duration_minutes as number | null | undefined) ?? null,
      planNotes: (row.notes as string | null | undefined) ?? null,
      status: trackingEnabled ? normalizeExerciseStatus(row.status) : "pending",
      executionNotes: trackingEnabled
        ? ((row.execution_notes as string | null | undefined) ?? null)
        : null,
    };
  });

  return { exercises };
}

function normalizeExerciseStatus(value: unknown): TrainingSessionExerciseStatus {
  if (value === "in_progress" || value === "completed" || value === "skipped") {
    return value;
  }
  return "pending";
}

export async function updateSessionExercise(
  supabase: SupabaseClient,
  userId: string,
  sessionExerciseId: string,
  input: {
    status?: TrainingSessionExerciseStatus;
    executionNotes?: string | null;
  }
): Promise<{ exercise: TrainingSessionExercise | null; error?: string }> {
  const { data: row, error: fetchError } = await supabase
    .from("training_session_exercises")
    .select(
      "id, training_session_id, sort_order, duration_minutes, notes, status, execution_notes, exercises(name, category)"
    )
    .eq("id", sessionExerciseId)
    .maybeSingle();

  if (fetchError && isMissingTrackingColumnError(fetchError.message)) {
    return {
      exercise: null,
      error: "Session tracking columns are not available yet. Run migration 024 in Supabase.",
    };
  }

  if (fetchError) {
    return { exercise: null, error: fetchError.message };
  }

  if (!row) {
    return { exercise: null, error: "Exercise not found in this session." };
  }

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("id, created_by, status")
    .eq("id", row.training_session_id as string)
    .maybeSingle();

  if (sessionError) {
    return { exercise: null, error: sessionError.message };
  }

  if (!session || session.created_by !== userId) {
    return { exercise: null, error: "Training session not found." };
  }

  if (session.status === "completed") {
    return { exercise: null, error: "This session is already completed." };
  }

  const updatePayload: Record<string, unknown> = {};
  if (input.status !== undefined) {
    updatePayload.status = input.status;
  }
  if (input.executionNotes !== undefined) {
    updatePayload.execution_notes = input.executionNotes?.trim() || null;
  }

  if (Object.keys(updatePayload).length === 0) {
    return { exercise: mapSessionExerciseRow(row), error: undefined };
  }

  const { data: updated, error: updateError } = await supabase
    .from("training_session_exercises")
    .update(updatePayload)
    .eq("id", sessionExerciseId)
    .select(
      "id, sort_order, duration_minutes, notes, status, execution_notes, exercises(name, category)"
    )
    .single();

  if (updateError) {
    if (isMissingTrackingColumnError(updateError.message)) {
      return {
        exercise: null,
        error: "Session tracking columns are not available yet. Run migration 024 in Supabase.",
      };
    }
    return { exercise: null, error: updateError.message };
  }

  return { exercise: mapSessionExerciseRow(updated) };
}

function mapSessionExerciseRow(row: Record<string, unknown>): TrainingSessionExercise {
  const exercise = row.exercises as { name?: string; category?: string } | null;
  return {
    id: row.id as string,
    label: exercise?.name?.trim() || "Untitled exercise",
    category: exercise?.category?.trim() || null,
    sortOrder: row.sort_order as number,
    durationMinutes: (row.duration_minutes as number | null | undefined) ?? null,
    planNotes: (row.notes as string | null | undefined) ?? null,
    status: normalizeExerciseStatus(row.status),
    executionNotes: (row.execution_notes as string | null | undefined) ?? null,
  };
}
