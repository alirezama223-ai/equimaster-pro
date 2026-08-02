import { activeInjuryRule } from "@/app/lib/health/rules/rules/active-injury";
import { feverRule } from "@/app/lib/health/rules/rules/fever";
import { lamenessRule } from "@/app/lib/health/rules/rules/lameness";
import { overdueFarrierRule } from "@/app/lib/health/rules/rules/overdue-farrier";
import { overdueVaccinationRule } from "@/app/lib/health/rules/rules/overdue-vaccination";
import {
  clampHealthScore,
  combineReadinessScores,
  selectPrimaryHealthAlert,
  snapshotHasHealthData,
  type CombinedReadinessResult,
  type HealthRuleModule,
} from "@/app/lib/health/rules/helpers";
import type { HealthEvaluationResult, HorseHealthSnapshot } from "@/app/types/health";

export const HEALTH_RULE_MODULES: HealthRuleModule[] = [
  feverRule,
  lamenessRule,
  overdueFarrierRule,
  overdueVaccinationRule,
  activeInjuryRule,
];

export function evaluateHealthRules(snapshot: HorseHealthSnapshot): HealthEvaluationResult {
  const results = HEALTH_RULE_MODULES.map((rule) => rule.evaluate(snapshot));
  const alerts = results.map((result) => result.alert);
  const hasData = snapshotHasHealthData(snapshot);

  const healthScore = hasData
    ? clampHealthScore(
        results.reduce((sum, result) => sum + result.healthContribution, 0) / results.length
      )
    : 100;

  return {
    provider: "rule-engine",
    healthScore,
    hasData,
    alerts,
    primaryAlert: selectPrimaryHealthAlert(alerts),
  };
}

export { combineReadinessScores, type CombinedReadinessResult };

export type { HealthRuleModule } from "@/app/lib/health/rules/helpers";
