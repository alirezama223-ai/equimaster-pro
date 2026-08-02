import type { ExerciseLibraryItem } from "@/app/lib/training/plans/exercises";
import {
  WEEKDAY_LABELS,
  type TrainingPlanEditorDay,
  type TrainingPlanEditorExercise,
  type TrainingPlanEditorWeek,
} from "@/app/lib/training/plans/editor-types";

export function createEditorWeek(weekNumber: number): TrainingPlanEditorWeek {
  const weekId = crypto.randomUUID();

  return {
    id: weekId,
    weekNumber,
    title: `Week ${weekNumber}`,
    goal: null,
    days: WEEKDAY_LABELS.map((dayLabel, index) => ({
      id: crypto.randomUUID(),
      dayNumber: index + 1,
      dayLabel,
      title: null,
      goal: null,
      isRestDay: false,
      exercises: [],
    })),
  };
}

export function addWeek(weeks: TrainingPlanEditorWeek[]): TrainingPlanEditorWeek[] {
  const nextWeekNumber =
    weeks.length > 0 ? Math.max(...weeks.map((week) => week.weekNumber)) + 1 : 1;

  return [...weeks, createEditorWeek(nextWeekNumber)];
}

export function updateWeekDetails(
  weeks: TrainingPlanEditorWeek[],
  weekId: string,
  updates: { title?: string | null; goal?: string | null }
): TrainingPlanEditorWeek[] {
  return weeks.map((week) =>
    week.id === weekId
      ? {
          ...week,
          title: updates.title !== undefined ? updates.title : week.title,
          goal: updates.goal !== undefined ? updates.goal : week.goal,
        }
      : week
  );
}

export function updateDayDetails(
  weeks: TrainingPlanEditorWeek[],
  dayId: string,
  updates: { title?: string | null; goal?: string | null }
): TrainingPlanEditorWeek[] {
  return updateDayInWeeks(weeks, dayId, (day) => ({
    ...day,
    title: updates.title !== undefined ? updates.title : day.title,
    goal: updates.goal !== undefined ? updates.goal : day.goal,
  }));
}

export function createEditorExerciseFromLibrary(
  item: ExerciseLibraryItem,
  sortOrder: number
): TrainingPlanEditorExercise {
  return {
    id: crypto.randomUUID(),
    exerciseId: item.id,
    name: item.name,
    category: item.category,
    durationMinutes: item.durationMinutes,
    durationLabel: item.durationLabel,
    sortOrder,
  };
}

function normalizeDayExercises(exercises: TrainingPlanEditorExercise[]): TrainingPlanEditorExercise[] {
  return [...exercises]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((exercise, index) => ({
      ...exercise,
      sortOrder: index,
    }));
}

function updateDayInWeeks(
  weeks: TrainingPlanEditorWeek[],
  dayId: string,
  updater: (day: TrainingPlanEditorDay) => TrainingPlanEditorDay
): TrainingPlanEditorWeek[] {
  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => (day.id === dayId ? updater(day) : day)),
  }));
}

export function addExerciseToDay(
  weeks: TrainingPlanEditorWeek[],
  dayId: string,
  item: ExerciseLibraryItem
): TrainingPlanEditorWeek[] {
  return updateDayInWeeks(weeks, dayId, (day) => {
    const nextSortOrder = day.exercises.length;
    const nextExercise = createEditorExerciseFromLibrary(item, nextSortOrder);

    return {
      ...day,
      isRestDay: false,
      exercises: normalizeDayExercises([...day.exercises, nextExercise]),
    };
  });
}

export function removeExerciseFromDay(
  weeks: TrainingPlanEditorWeek[],
  dayId: string,
  exerciseInstanceId: string
): TrainingPlanEditorWeek[] {
  return updateDayInWeeks(weeks, dayId, (day) => ({
    ...day,
    exercises: normalizeDayExercises(
      day.exercises.filter((exercise) => exercise.id !== exerciseInstanceId)
    ),
  }));
}

export function moveExerciseInDay(
  weeks: TrainingPlanEditorWeek[],
  dayId: string,
  exerciseInstanceId: string,
  direction: "up" | "down"
): TrainingPlanEditorWeek[] {
  return updateDayInWeeks(weeks, dayId, (day) => {
    const ordered = normalizeDayExercises(day.exercises);
    const index = ordered.findIndex((exercise) => exercise.id === exerciseInstanceId);

    if (index === -1) {
      return day;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ordered.length) {
      return day;
    }

    const reordered = [...ordered];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    return {
      ...day,
      exercises: normalizeDayExercises(reordered),
    };
  });
}

export function setDayRestDay(
  weeks: TrainingPlanEditorWeek[],
  dayId: string,
  isRestDay: boolean
): TrainingPlanEditorWeek[] {
  return updateDayInWeeks(weeks, dayId, (day) => ({
    ...day,
    isRestDay,
    exercises: isRestDay ? [] : day.exercises,
  }));
}

export function findDayById(
  weeks: TrainingPlanEditorWeek[],
  dayId: string
): TrainingPlanEditorDay | null {
  for (const week of weeks) {
    const day = week.days.find((entry) => entry.id === dayId);
    if (day) {
      return day;
    }
  }

  return null;
}
