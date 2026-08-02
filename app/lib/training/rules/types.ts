import type {
  CoachNoteEntry,
  ExerciseFrequencyItem,
  HorseFeelingDistribution,
  HorseTrainingSummary,
  RatingTrendPoint,
  RuleEvaluationResult,
  TrainingLoadDay,
} from "@/app/types/training-analytics";

export type RuleSeverity = "info" | "watch" | "alert" | "positive";

export type RuleId = "fatigue" | "workload" | "consistency" | "recovery" | "jumping_balance";

export type RuleInsight = {
  ruleId: RuleId;
  severity: RuleSeverity;
  title: string;
  explanation: string;
  recommendation: string;
};

export type RuleEvaluationContext = {
  summary: HorseTrainingSummary;
  ratingsOverTime: RatingTrendPoint[];
  trainingLoad: TrainingLoadDay[];
  exerciseFrequency: ExerciseFrequencyItem[];
  coachNotes: CoachNoteEntry[];
  horseFeelingDistribution: HorseFeelingDistribution[];
};

export type RuleModuleResult = {
  readinessContribution: number;
  insight: RuleInsight;
};

export type RuleModule = {
  id: RuleId;
  evaluate: (context: RuleEvaluationContext) => RuleModuleResult;
};

export interface RuleEngineProvider {
  readonly id: string;
  evaluate(context: RuleEvaluationContext): Omit<
    RuleEvaluationResult,
    "combinedReadinessScore" | "healthScore" | "healthAlerts" | "primaryHealthAlert"
  >;
}

export type { RuleEvaluationResult };
