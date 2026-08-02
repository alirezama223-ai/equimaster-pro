import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDurationMinutes } from "@/app/lib/training/format";
import {
  formatTrainingPlanDayHeading,
  WEEKDAY_LABELS,
  type TrainingPlanEditorData,
  type TrainingPlanEditorDay,
  type TrainingPlanEditorExercise,
  type TrainingPlanEditorWeek,
} from "@/app/lib/training/plans/editor-types";
import { fetchTrainingPlanAssignmentHorseIds } from "@/app/lib/training/plans/assignments";
import { formatExerciseCategory } from "@/app/lib/training/plans/exercises";
import { formatTrainingPlanDuration } from "@/app/lib/training/plans/format";
import { fetchTrainingPlanById } from "@/app/lib/training/plans/queries";
import type { TrainingPlanStatus } from "@/app/types/training-plans";

type WeekRow = {
  id: string;
  week_number: number;
  title: string | null;
  goal: string | null;
};

type DayRow = {
  id: string;
  training_plan_week_id: string;
  day_number: number;
  title: string | null;
  goal: string | null;
  is_rest_day: boolean;
};

type ExerciseRow = {
  id: string;
  training_plan_day_id: string;
  exercise_id: string;
  sort_order: number;
  target_duration_minutes: number | null;
  exercises: {
    name: string;
    category: string;
    duration_minutes: number | null;
  } | null;
};

export function createDefaultEditorWeeks(planId: string): TrainingPlanEditorWeek[] {
  const weekId = `${planId}-week-1`;

  return [
    {
      id: weekId,
      weekNumber: 1,
      title: "Week 1",
      goal: null,
      days: WEEKDAY_LABELS.map((dayLabel, index) => ({
        id: `${weekId}-day-${index + 1}`,
        dayNumber: index + 1,
        dayLabel,
        title: null,
        goal: null,
        isRestDay: false,
        exercises: [],
      })),
    },
  ];
}

function mapExerciseRow(row: ExerciseRow): TrainingPlanEditorExercise {
  const exercise = row.exercises;
  const durationMinutes =
    row.target_duration_minutes ?? exercise?.duration_minutes ?? null;

  return {
    id: row.id,
    exerciseId: row.exercise_id,
    name: exercise?.name ?? "Unknown exercise",
    category: formatExerciseCategory(exercise?.category ?? "other"),
    durationMinutes,
    durationLabel: formatDurationMinutes(durationMinutes),
    sortOrder: row.sort_order,
  };
}

function buildEditorWeeks(
  weekRows: WeekRow[],
  dayRows: DayRow[],
  exerciseRows: ExerciseRow[]
): TrainingPlanEditorWeek[] {
  const daysByWeekId = new Map<string, DayRow[]>();
  for (const day of dayRows) {
    const days = daysByWeekId.get(day.training_plan_week_id) ?? [];
    days.push(day);
    daysByWeekId.set(day.training_plan_week_id, days);
  }

  const exercisesByDayId = new Map<string, ExerciseRow[]>();
  for (const exercise of exerciseRows) {
    const exercises = exercisesByDayId.get(exercise.training_plan_day_id) ?? [];
    exercises.push(exercise);
    exercisesByDayId.set(exercise.training_plan_day_id, exercises);
  }

  return weekRows
    .sort((a, b) => a.week_number - b.week_number)
    .map((week) => ({
      id: week.id,
      weekNumber: week.week_number,
      title: week.title,
      goal: week.goal,
      days: (daysByWeekId.get(week.id) ?? [])
        .sort((a, b) => a.day_number - b.day_number)
        .map((day): TrainingPlanEditorDay => {
          const exercises = (exercisesByDayId.get(day.id) ?? [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(mapExerciseRow);

          return {
            id: day.id,
            dayNumber: day.day_number,
            dayLabel: WEEKDAY_LABELS[day.day_number - 1] ?? `Day ${day.day_number}`,
            title: day.title,
            goal: day.goal,
            isRestDay: day.is_rest_day,
            exercises,
          };
        }),
    }));
}

export async function fetchTrainingPlanEditor(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<{ plan: TrainingPlanEditorData | null; error?: string; assignmentError?: string }> {
  const planResult = await fetchTrainingPlanById(supabase, userId, planId);
  if (planResult.error) {
    return { plan: null, error: planResult.error };
  }

  if (!planResult.plan) {
    return { plan: null };
  }

  const plan = planResult.plan;

  const { data: weekRows, error: weekError } = await supabase
    .from("training_plan_weeks")
    .select("id, week_number, title, goal")
    .eq("training_plan_id", planId)
    .order("week_number", { ascending: true });

  if (weekError) {
    return {
      plan: null,
      error: weekError.message.includes("does not exist")
        ? "Training plan structure tables are not available yet. Run migration 021 and 022 in Supabase."
        : weekError.message,
    };
  }

  const weeks = (weekRows ?? []) as WeekRow[];
  let editorWeeks: TrainingPlanEditorWeek[];

  if (weeks.length === 0) {
    editorWeeks = createDefaultEditorWeeks(planId);
  } else {
    const weekIds = weeks.map((week) => week.id);

    const { data: dayRows, error: dayError } = await supabase
      .from("training_plan_days")
      .select("id, training_plan_week_id, day_number, title, goal, is_rest_day")
      .in("training_plan_week_id", weekIds)
      .order("day_number", { ascending: true });

    if (dayError) {
      return { plan: null, error: dayError.message };
    }

    const days = (dayRows ?? []) as DayRow[];
    const dayIds = days.map((day) => day.id);

    let exerciseRows: ExerciseRow[] = [];
    if (dayIds.length > 0) {
      const { data, error: exerciseError } = await supabase
        .from("training_plan_exercises")
        .select(
          "id, training_plan_day_id, exercise_id, sort_order, target_duration_minutes, exercises(name, category, duration_minutes)"
        )
        .in("training_plan_day_id", dayIds)
        .order("sort_order", { ascending: true });

      if (exerciseError) {
        return { plan: null, error: exerciseError.message };
      }

      exerciseRows = (data ?? []) as unknown as ExerciseRow[];
    }

    editorWeeks = buildEditorWeeks(weeks, days, exerciseRows);
  }

  const assignmentResult = await fetchTrainingPlanAssignmentHorseIds(supabase, userId, planId);

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      status: plan.status as TrainingPlanStatus,
      durationLabel: formatTrainingPlanDuration(plan.startDate, plan.endDate, editorWeeks.length),
      weekCount: editorWeeks.length,
      weeks: editorWeeks,
      assignedHorseIds: assignmentResult.horseIds,
    },
    assignmentError: assignmentResult.error,
  };
}

export { formatTrainingPlanDayHeading };
