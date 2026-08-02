import type { TrainingPlanStatus } from "@/app/types/training-plans";

export type TrainingPlanEditorExercise = {
  id: string;
  exerciseId: string;
  name: string;
  category: string;
  durationMinutes: number | null;
  durationLabel: string;
  sortOrder: number;
};

export type TrainingPlanEditorDay = {
  id: string;
  dayNumber: number;
  dayLabel: string;
  title: string | null;
  goal: string | null;
  isRestDay: boolean;
  exercises: TrainingPlanEditorExercise[];
};

export type TrainingPlanEditorWeek = {
  id: string;
  weekNumber: number;
  title: string | null;
  goal: string | null;
  days: TrainingPlanEditorDay[];
};

export type TrainingPlanEditorData = {
  id: string;
  name: string;
  description: string | null;
  status: TrainingPlanStatus;
  durationLabel: string;
  weekCount: number;
  weeks: TrainingPlanEditorWeek[];
  assignedHorseIds: string[];
};

export const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export function formatTrainingPlanDayHeading(day: {
  dayNumber: number;
  dayLabel: string;
}): string {
  return `Day ${day.dayNumber} — ${day.dayLabel}`;
}

export type SaveTrainingPlanExercisePayload = {
  exerciseId: string;
  sortOrder: number;
  notes: string | null;
  targetDurationMinutes: number | null;
};

export type SaveTrainingPlanDayPayload = {
  dayNumber: number;
  title: string | null;
  goal: string | null;
  isRestDay: boolean;
  exercises: SaveTrainingPlanExercisePayload[];
};

export type SaveTrainingPlanWeekPayload = {
  weekNumber: number;
  title: string | null;
  goal: string | null;
  days: SaveTrainingPlanDayPayload[];
};

export type SaveTrainingPlanStructurePayload = {
  weeks: SaveTrainingPlanWeekPayload[];
};
