import { consistencyRule } from "@/app/lib/training/rules/rules/consistency";
import { fatigueRule } from "@/app/lib/training/rules/rules/fatigue";
import { jumpingBalanceRule } from "@/app/lib/training/rules/rules/jumping-balance";
import { recoveryRule } from "@/app/lib/training/rules/rules/recovery";
import { workloadRule } from "@/app/lib/training/rules/rules/workload";
import { clampScore } from "@/app/lib/training/rules/helpers";
import type {
  RuleEngineProvider,
  RuleEvaluationContext,
  RuleInsight,
  RuleModule,
} from "@/app/lib/training/rules/types";

const RULE_MODULES: RuleModule[] = [
  fatigueRule,
  workloadRule,
  consistencyRule,
  recoveryRule,
  jumpingBalanceRule,
];

const SEVERITY_PRIORITY: Record<RuleInsight["severity"], number> = {
  alert: 0,
  watch: 1,
  info: 2,
  positive: 3,
};

function selectPrimaryInsight(insights: RuleInsight[]): RuleInsight | null {
  if (insights.length === 0) return null;

  return [...insights].sort((left, right) => {
    const severityDiff = SEVERITY_PRIORITY[left.severity] - SEVERITY_PRIORITY[right.severity];
    if (severityDiff !== 0) return severityDiff;
    return left.ruleId.localeCompare(right.ruleId);
  })[0];
}

export class RuleBasedProvider implements RuleEngineProvider {
  readonly id = "rule-engine";

  evaluate(context: RuleEvaluationContext) {
    const results = RULE_MODULES.map((rule) => rule.evaluate(context));
    const insights = results.map((result) => result.insight);
    const readinessScore = clampScore(
      results.reduce((sum, result) => sum + result.readinessContribution, 0) / results.length
    );

    return {
      provider: "rule-engine" as const,
      readinessScore,
      insights,
      primaryInsight: selectPrimaryInsight(insights),
    };
  }
}

export { RULE_MODULES };
