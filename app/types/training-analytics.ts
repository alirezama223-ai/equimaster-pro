export type HorseTrainingSummary = {
  pedigreeHorseId: string;
  horseName: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  completionRateLabel: string;
  averageRating: number | null;
  averageDurationMinutes: number | null;
  currentTrainingStreak: number;
  lastSessionDate: string | null;
  lastSessionDateLabel: string | null;
  lastSessionId: string | null;
};

export type RatingTrendPoint = {
  sessionDate: string;
  dateLabel: string;
  rating: number;
  sessionId: string;
};

export type TrainingLoadDay = {
  date: string;
  dateLabel: string;
  sessionCount: number;
  totalDurationMinutes: number;
};

export type ExerciseFrequencyItem = {
  exerciseId: string;
  label: string;
  category: string | null;
  count: number;
};

export type CoachNoteEntry = {
  id: string;
  sessionDate: string;
  dateLabel: string;
  title: string;
  coachNotes: string;
};

export type HorseFeelingDistribution = {
  feeling: string;
  count: number;
};

export type RuleSeverity = "info" | "watch" | "alert" | "positive";

export type RuleId = "fatigue" | "workload" | "consistency" | "recovery" | "jumping_balance";

export type RuleInsight = {
  ruleId: RuleId;
  severity: RuleSeverity;
  title: string;
  explanation: string;
  recommendation: string;
};

import type { HealthAlert } from "@/app/types/health";

export type RuleEvaluationResult = {
  provider: "rule-engine" | "openai";
  readinessScore: number;
  combinedReadinessScore: number;
  healthScore: number | null;
  healthAlerts: HealthAlert[];
  primaryHealthAlert: HealthAlert | null;
  insights: RuleInsight[];
  primaryInsight: RuleInsight | null;
};

export type HorseTrainingAnalytics = {
  summary: HorseTrainingSummary;
  ratingsOverTime: RatingTrendPoint[];
  trainingLoad: TrainingLoadDay[];
  exerciseFrequency: ExerciseFrequencyItem[];
  coachNotes: CoachNoteEntry[];
  horseFeelingDistribution: HorseFeelingDistribution[];
  ruleEvaluation: RuleEvaluationResult;
};

export type HorseTrainingAnalyticsErrors = {
  summary?: string;
  ratings?: string;
  load?: string;
  exercises?: string;
  coachNotes?: string;
  feelings?: string;
  general?: string;
};
