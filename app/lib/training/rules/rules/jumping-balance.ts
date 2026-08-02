import { clampScore, severityFromScore } from "@/app/lib/training/rules/helpers";
import type { RuleEvaluationContext, RuleModule, RuleModuleResult } from "@/app/lib/training/rules/types";

const JUMPING_CATEGORIES = new Set(["jumping", "polework", "gymnastic"]);
const FLAT_CATEGORIES = new Set(["flatwork", "warmup", "cooldown", "groundwork", "conditioning"]);

function normalizeCategory(category: string | null): string {
  return category?.trim().toLowerCase() ?? "";
}

function evaluateJumpingBalance(context: RuleEvaluationContext): RuleModuleResult {
  const { summary, exerciseFrequency } = context;

  if (summary.totalSessions === 0 || exerciseFrequency.length === 0) {
    return {
      readinessContribution: 50,
      insight: {
        ruleId: "jumping_balance",
        severity: "info",
        title: "Jumping balance not yet measurable",
        explanation: "Exercise frequency data is needed to assess jumping versus flatwork mix.",
        recommendation: "Use structured training plans so session exercises are logged consistently.",
      },
    };
  }

  let jumpingCount = 0;
  let flatCount = 0;
  let otherCount = 0;

  for (const exercise of exerciseFrequency) {
    const category = normalizeCategory(exercise.category);
    const weighted = exercise.count;

    if (JUMPING_CATEGORIES.has(category)) {
      jumpingCount += weighted;
    } else if (FLAT_CATEGORIES.has(category)) {
      flatCount += weighted;
    } else {
      otherCount += weighted;
    }
  }

  const total = jumpingCount + flatCount + otherCount;
  const jumpingShare = total > 0 ? jumpingCount / total : 0;
  const flatShare = total > 0 ? flatCount / total : 0;

  let score = 80;
  if (jumpingShare >= 0.65) score -= 30;
  else if (jumpingShare >= 0.5) score -= 15;
  else if (jumpingShare >= 0.25 && jumpingShare <= 0.45) score += 10;

  if (jumpingShare < 0.1 && total >= 8) score -= 15;
  if (flatShare < 0.25 && jumpingShare > 0.4) score -= 10;

  score = clampScore(score);
  const severity = severityFromScore(score);

  if (jumpingShare >= 0.5) {
    return {
      readinessContribution: score,
      insight: {
        ruleId: "jumping_balance",
        severity,
        title: severity === "alert" ? "Jumping-heavy program detected" : "Jumping load is trending high",
        explanation: `${Math.round(jumpingShare * 100)}% of logged exercises are jumping or polework (${jumpingCount} of ${total} instances).`,
        recommendation:
          "Rebalance the next week with flatwork, suppleness, and cooldown blocks before adding more jumping.",
      },
    };
  }

  if (jumpingShare < 0.1 && total >= 8) {
    return {
      readinessContribution: score,
      insight: {
        ruleId: "jumping_balance",
        severity: "watch",
        title: "Limited jumping exposure",
        explanation: `Only ${Math.round(jumpingShare * 100)}% of logged exercises involve jumping or polework.`,
        recommendation:
          "Introduce low-height polework or gymnastics once per week to maintain jumping technique.",
      },
    };
  }

  return {
    readinessContribution: score,
    insight: {
      ruleId: "jumping_balance",
      severity: "positive",
      title: "Jumping and flatwork are well balanced",
      explanation: `${Math.round(jumpingShare * 100)}% jumping/polework and ${Math.round(flatShare * 100)}% flatwork and foundation exercises.`,
      recommendation: "Maintain this mix while progressing difficulty gradually on jump days only.",
    },
  };
}

export const jumpingBalanceRule: RuleModule = {
  id: "jumping_balance",
  evaluate: evaluateJumpingBalance,
};
