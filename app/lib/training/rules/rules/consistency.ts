import { clampScore, severityFromScore, sumTrainingLoad } from "@/app/lib/training/rules/helpers";
import type { RuleEvaluationContext, RuleModule, RuleModuleResult } from "@/app/lib/training/rules/types";

function evaluateConsistency(context: RuleEvaluationContext): RuleModuleResult {
  const { summary, trainingLoad } = context;

  if (summary.totalSessions === 0) {
    return {
      readinessContribution: 50,
      insight: {
        ruleId: "consistency",
        severity: "info",
        title: "Consistency pattern not yet formed",
        explanation: "There are no logged sessions to evaluate training rhythm.",
        recommendation: "Aim for two to three sessions per week to establish a baseline routine.",
      },
    };
  }

  const lastThirtyDays = sumTrainingLoad(trainingLoad);
  const streak = summary.currentTrainingStreak;
  const completionRate = summary.completionRate;

  let score = 60;
  if (streak >= 5) score += 25;
  else if (streak >= 3) score += 18;
  else if (streak >= 1) score += 8;
  else if (summary.completedSessions >= 3) score -= 15;

  if (completionRate >= 85) score += 15;
  else if (completionRate >= 70) score += 8;
  else if (completionRate < 50) score -= 15;

  if (lastThirtyDays.sessionCount >= 8) score += 10;
  else if (lastThirtyDays.sessionCount <= 2 && summary.completedSessions >= 3) score -= 10;

  score = clampScore(score);
  const severity = severityFromScore(score);

  if (severity === "alert" || severity === "watch") {
    return {
      readinessContribution: score,
      insight: {
        ruleId: "consistency",
        severity,
        title: "Training consistency is slipping",
        explanation: `Current streak is ${streak} day(s) with ${summary.completionRateLabel} completion rate and ${lastThirtyDays.sessionCount} session(s) in the last 30 days.`,
        recommendation:
          "Block two short, fixed sessions this week at the same time of day to rebuild rhythm.",
      },
    };
  }

  return {
    readinessContribution: score,
    insight: {
      ruleId: "consistency",
      severity: streak >= 3 ? "positive" : "info",
      title: streak >= 3 ? "Strong training consistency" : "Consistency is stable",
      explanation: `${streak}-day streak with ${summary.completionRateLabel} completion rate across ${summary.totalSessions} sessions.`,
      recommendation: "Protect the current schedule before adding new exercises or longer sessions.",
    },
  };
}

export const consistencyRule: RuleModule = {
  id: "consistency",
  evaluate: evaluateConsistency,
};
