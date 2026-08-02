export { createDefaultRuleEngineProvider, getRuleEngineProvider, setRuleEngineProvider } from "@/app/lib/training/rules/registry";
export { RuleBasedProvider, RULE_MODULES } from "@/app/lib/training/rules/rule-based-provider";
export { OpenAIProvider } from "@/app/lib/training/rules/openai-provider";
export type {
  RuleEngineProvider,
  RuleEvaluationContext,
  RuleEvaluationResult,
  RuleInsight,
  RuleId,
  RuleModule,
  RuleSeverity,
} from "@/app/lib/training/rules/types";

import { getRuleEngineProvider } from "@/app/lib/training/rules/registry";
import type { RuleEvaluationContext } from "@/app/lib/training/rules/types";
import type { RuleEvaluationResult } from "@/app/types/training-analytics";
import type { HorseTrainingAnalytics } from "@/app/types/training-analytics";
import { combineReadinessScores } from "@/app/lib/health/rules";
import type { HealthEvaluationResult } from "@/app/types/health";

export function buildRuleEvaluationContext(
  analytics: Omit<HorseTrainingAnalytics, "ruleEvaluation">
): RuleEvaluationContext {
  return {
    summary: analytics.summary,
    ratingsOverTime: analytics.ratingsOverTime,
    trainingLoad: analytics.trainingLoad,
    exerciseFrequency: analytics.exerciseFrequency,
    coachNotes: analytics.coachNotes,
    horseFeelingDistribution: analytics.horseFeelingDistribution,
  };
}

function attachHealthToRuleEvaluation(
  trainingEvaluation: Omit<RuleEvaluationResult, "combinedReadinessScore" | "healthScore" | "healthAlerts" | "primaryHealthAlert">,
  healthEvaluation: HealthEvaluationResult
): RuleEvaluationResult {
  const combined = combineReadinessScores(trainingEvaluation.readinessScore, healthEvaluation);

  return {
    ...trainingEvaluation,
    combinedReadinessScore: combined.combinedReadinessScore,
    healthScore: combined.healthScore,
    healthAlerts: combined.healthAlerts,
    primaryHealthAlert: combined.primaryHealthAlert,
  };
}

export function evaluateHorseTrainingRules(
  analytics: Omit<HorseTrainingAnalytics, "ruleEvaluation">,
  provider = getRuleEngineProvider()
): RuleEvaluationResult {
  const trainingEvaluation = provider.evaluate(buildRuleEvaluationContext(analytics));
  const emptyHealth: HealthEvaluationResult = {
    provider: "rule-engine",
    healthScore: 100,
    hasData: false,
    alerts: [],
    primaryAlert: null,
  };

  return attachHealthToRuleEvaluation(trainingEvaluation, emptyHealth);
}

export function mergeRuleEvaluationWithHealth(
  trainingEvaluation: Omit<RuleEvaluationResult, "combinedReadinessScore" | "healthScore" | "healthAlerts" | "primaryHealthAlert">,
  healthEvaluation: HealthEvaluationResult
): RuleEvaluationResult {
  return attachHealthToRuleEvaluation(trainingEvaluation, healthEvaluation);
}
