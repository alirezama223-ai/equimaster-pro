import type {
  SaveTrainingPlanStructurePayload,
  TrainingPlanEditorWeek,
} from "@/app/lib/training/plans/editor-types";

type ComparableExercise = {
  exerciseId: string;
  sortOrder: number;
};

type ComparableDay = {
  dayNumber: number;
  title: string | null;
  goal: string | null;
  isRestDay: boolean;
  exercises: ComparableExercise[];
};

type ComparableWeek = {
  weekNumber: number;
  title: string | null;
  goal: string | null;
  days: ComparableDay[];
};

function normalizeWeeks(weeks: TrainingPlanEditorWeek[]): ComparableWeek[] {
  return weeks
    .map((week) => ({
      weekNumber: week.weekNumber,
      title: week.title,
      goal: week.goal,
      days: week.days
        .map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          goal: day.goal,
          isRestDay: day.isRestDay,
          exercises: [...day.exercises]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((exercise) => ({
              exerciseId: exercise.exerciseId,
              sortOrder: exercise.sortOrder,
            })),
        }))
        .sort((a, b) => a.dayNumber - b.dayNumber),
    }))
    .sort((a, b) => a.weekNumber - b.weekNumber);
}

export function serializeEditorWeeksForComparison(weeks: TrainingPlanEditorWeek[]): string {
  return JSON.stringify(normalizeWeeks(weeks));
}

export function isTrainingPlanAssignmentsDirty(
  savedHorseIds: string[],
  currentHorseIds: string[]
): boolean {
  const normalize = (ids: string[]) => [...ids].sort();
  return JSON.stringify(normalize(savedHorseIds)) !== JSON.stringify(normalize(currentHorseIds));
}

export function isTrainingPlanEditorDirty(
  savedWeeks: TrainingPlanEditorWeek[],
  currentWeeks: TrainingPlanEditorWeek[]
): boolean {
  return (
    serializeEditorWeeksForComparison(savedWeeks) !==
    serializeEditorWeeksForComparison(currentWeeks)
  );
}

export function cloneEditorWeeks(weeks: TrainingPlanEditorWeek[]): TrainingPlanEditorWeek[] {
  return JSON.parse(JSON.stringify(weeks)) as TrainingPlanEditorWeek[];
}

export function buildSaveTrainingPlanPayload(
  weeks: TrainingPlanEditorWeek[]
): SaveTrainingPlanStructurePayload {
  return {
    weeks: weeks
      .map((week) => ({
        weekNumber: week.weekNumber,
        title: week.title,
        goal: week.goal,
        days: week.days
          .map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            goal: day.goal,
            isRestDay: day.isRestDay,
            exercises: day.isRestDay
              ? []
              : [...day.exercises]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((exercise) => ({
                    exerciseId: exercise.exerciseId,
                    sortOrder: exercise.sortOrder,
                    notes: null,
                    targetDurationMinutes: exercise.durationMinutes,
                  })),
          }))
          .sort((a, b) => a.dayNumber - b.dayNumber),
      }))
      .sort((a, b) => a.weekNumber - b.weekNumber),
  };
}
