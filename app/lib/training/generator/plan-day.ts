import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanDayExerciseTemplate = {
  exerciseId: string;
  sortOrder: number;
  durationMinutes: number | null;
  notes: string | null;
};

export type PlanDayTemplate = {
  dayId: string;
  title: string | null;
  goal: string | null;
  isRestDay: boolean;
  exercises: PlanDayExerciseTemplate[];
};

async function fetchDemoExerciseFallback(
  supabase: SupabaseClient,
  trainingPlanId: string,
  weekNumber: number,
  dayNumber: number
): Promise<PlanDayTemplate | null> {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, category, duration_minutes")
    .eq("source", "system")
    .in("category", ["warmup", "flatwork", "cooldown"])
    .order("category", { ascending: true })
    .limit(3);

  if (error || !data || data.length === 0) {
    return null;
  }

  return {
    dayId: `fallback:${trainingPlanId}:${weekNumber}:${dayNumber}`,
    title: "Demo training session",
    goal: "Maintain rhythm, suppleness, and quality transitions.",
    isRestDay: false,
    exercises: data.map((row, index) => ({
      exerciseId: row.id as string,
      sortOrder: index,
      durationMinutes: (row.duration_minutes as number | null | undefined) ?? null,
      notes: null,
    })),
  };
}

export async function fetchPlanDayTemplate(
  supabase: SupabaseClient,
  trainingPlanId: string,
  weekNumber: number,
  dayNumber: number
): Promise<{ template: PlanDayTemplate | null; error?: string }> {
  const { data: weekRow, error: weekError } = await supabase
    .from("training_plan_weeks")
    .select("id")
    .eq("training_plan_id", trainingPlanId)
    .eq("week_number", weekNumber)
    .maybeSingle();

  if (weekError) {
    if (weekError.message.includes("does not exist")) {
      return { template: null };
    }

    return { template: null, error: weekError.message };
  }

  if (!weekRow) {
    const fallback = await fetchDemoExerciseFallback(
      supabase,
      trainingPlanId,
      weekNumber,
      dayNumber
    );
    return { template: fallback };
  }

  const { data: dayRow, error: dayError } = await supabase
    .from("training_plan_days")
    .select("id, title, goal, is_rest_day")
    .eq("training_plan_week_id", weekRow.id as string)
    .eq("day_number", dayNumber)
    .maybeSingle();

  if (dayError) {
    return { template: null, error: dayError.message };
  }

  if (!dayRow) {
    const fallback = await fetchDemoExerciseFallback(
      supabase,
      trainingPlanId,
      weekNumber,
      dayNumber
    );
    return { template: fallback };
  }

  if (dayRow.is_rest_day) {
    return {
      template: {
        dayId: dayRow.id as string,
        title: (dayRow.title as string | null) ?? null,
        goal: (dayRow.goal as string | null) ?? null,
        isRestDay: true,
        exercises: [],
      },
    };
  }

  const { data: exerciseRows, error: exerciseError } = await supabase
    .from("training_plan_exercises")
    .select("exercise_id, sort_order, target_duration_minutes, notes")
    .eq("training_plan_day_id", dayRow.id as string)
    .order("sort_order", { ascending: true });

  if (exerciseError) {
    return { template: null, error: exerciseError.message };
  }

  const exercises = (exerciseRows ?? []).map((row) => ({
    exerciseId: row.exercise_id as string,
    sortOrder: row.sort_order as number,
    durationMinutes: (row.target_duration_minutes as number | null | undefined) ?? null,
    notes: (row.notes as string | null | undefined) ?? null,
  }));

  return {
    template: {
      dayId: dayRow.id as string,
      title: (dayRow.title as string | null) ?? null,
      goal: (dayRow.goal as string | null) ?? null,
      isRestDay: false,
      exercises,
    },
  };
}
