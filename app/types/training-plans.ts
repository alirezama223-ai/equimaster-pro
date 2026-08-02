export type TrainingPlanStatus = "draft" | "active" | "completed" | "archived";

/** Row shape for `training_plans` (migration 020). */
export type TrainingPlan = {
  id: string;
  createdBy: string;
  name: string;
  description: string | null;
  status: TrainingPlanStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  weeks?: TrainingPlanWeek[];
};

/** Future `training_plan_weeks` table — week block within a plan. */
export type TrainingPlanWeek = {
  id: string;
  trainingPlanId: string;
  weekNumber: number;
  title: string | null;
  goal: string | null;
  days: TrainingPlanDay[];
};

/** Future `training_plan_days` table — day within a plan week. */
export type TrainingPlanDay = {
  id: string;
  trainingPlanWeekId: string;
  dayNumber: number;
  title: string | null;
  goal: string | null;
  exercises: TrainingPlanExercise[];
};

/** Future `training_plan_exercises` table — ordered exercise slot on a plan day. */
export type TrainingPlanExercise = {
  id: string;
  trainingPlanDayId: string;
  exerciseId: string;
  sortOrder: number;
  notes: string | null;
  targetDurationMinutes: number | null;
};

/** Summary row for the plans dashboard list. */
export type TrainingPlanListItem = {
  id: string;
  name: string;
  status: TrainingPlanStatus;
  durationLabel: string;
  assignedHorseCount: number;
  description: string | null;
};
