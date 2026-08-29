export type TrainingSessionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "skipped"
  | "cancelled";

export type TrainingHorse = {
  id: string;
  name: string;
  sex: string;
  discipline: string;
  subtitle: string;
};

export type TrainingTodayPlan = {
  planName: string;
  week: string;
  day: string;
  goal: string;
};

export type TrainingExerciseExecutionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped";

export type TrainingExerciseItem = {
  id: string;
  label: string;
  status?: TrainingExerciseExecutionStatus;
};

export type TrainingSessionExerciseStatus = TrainingExerciseExecutionStatus;

export type TrainingSessionExercise = {
  id: string;
  label: string;
  category: string | null;
  sortOrder: number;
  durationMinutes: number | null;
  planNotes: string | null;
  status: TrainingSessionExerciseStatus;
  executionNotes: string | null;
};

export type TrainingExerciseExecution = TrainingExerciseItem & {
  status: TrainingExerciseExecutionStatus;
  executionNotes?: string | null;
  category?: string | null;
  durationMinutes?: number | null;
  planNotes?: string | null;
};

export type TrainingSessionDetail = {
  id: string;
  status: TrainingSessionStatus;
  sessionDate: string;
  title: string;
  sessionGoal: string | null;
  pedigreeHorseId: string;
  horseName: string;
  trainingPlanId: string | null;
  trainingPlanName: string | null;
  notes: string | null;
  riderRating: number | null;
  horseFeeling: string | null;
  coachNotes: string | null;
  durationMinutes: number | null;
  startedAt: string | null;
};

export type TrainingSessionReflection = {
  riderRating: number | null;
  horseFeeling: string | null;
  coachNotes: string | null;
  notes: string | null;
};

export type TrainingRecentSession = {
  id: string;
  title: string;
  dateLabel: string;
  status: TrainingSessionStatus;
  durationMinutes: number | null;
  notesPreview: string | null;
};

export type TrainingSummary = {
  totalSessions: number;
  completedSessions: number;
  completionRateLabel: string;
  lastSessionDate: string | null;
  lastSessionDateLabel: string | null;
};

export type TrainingActivityDay = {
  date: string;
  dateLabel: string;
  sessionCount: number;
};

export type TrainingRecentNote = {
  id: string;
  sessionDate: string;
  dateLabel: string;
  title: string;
  notesPreview: string;
};

export type TrainingHorseDashboard = {
  plan: TrainingTodayPlan | null;
  todayExercises: TrainingExerciseItem[];
  recentSessions: TrainingRecentSession[];
  summary: TrainingSummary;
  activity: TrainingActivityDay[];
  recentNotes: TrainingRecentNote[];
  calendar: TrainingCalendarMonth;
};

export type TrainingDashboardErrors = {
  plan?: string;
  exercises?: string;
  sessions?: string;
  summary?: string;
  activity?: string;
  notes?: string;
  calendar?: string;
  general?: string;
};

export type TrainingCalendarSession = {
  id: string;
  sessionDate: string;
  dateLabel: string;
  status: TrainingSessionStatus;
  horseName: string;
  notesPreview: string | null;
};

export type TrainingCalendarDay = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  indicatorStatus: "completed" | "in_progress" | "planned" | "cancelled" | "skipped" | "none";
  session: TrainingCalendarSession | null;
};

export type TrainingCalendarMonth = {
  monthLabel: string;
  year: number;
  month: number;
  horseName: string;
  days: TrainingCalendarDay[];
};
