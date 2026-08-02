import {
  clampScore,
  recentRatingAverages,
  severityFromScore,
} from "@/app/lib/training/rules/helpers";
import type { RuleEvaluationContext, RuleModule, RuleModuleResult } from "@/app/lib/training/rules/types";

const FATIGUE_FEELINGS = new Set(["Tired", "Tense", "Spooky", "Flat"]);

function evaluateFatigue(context: RuleEvaluationContext): RuleModuleResult {
  const { summary, ratingsOverTime, horseFeelingDistribution } = context;

  if (summary.totalSessions === 0) {
    return {
      readinessContribution: 50,
      insight: {
        ruleId: "fatigue",
        severity: "info",
        title: "Fatigue baseline not established",
        explanation: "There is not enough session history to assess fatigue patterns yet.",
        recommendation: "Log a few completed sessions with horse feeling and rider ratings to enable fatigue tracking.",
      },
    };
  }

  const feelingTotal = horseFeelingDistribution.reduce((sum, item) => sum + item.count, 0);
  const fatigueFeelingCount = horseFeelingDistribution
    .filter((item) => FATIGUE_FEELINGS.has(item.feeling))
    .reduce((sum, item) => sum + item.count, 0);
  const fatigueRatio = feelingTotal > 0 ? fatigueFeelingCount / feelingTotal : 0;

  const { recent, prior } = recentRatingAverages(ratingsOverTime);
  const ratingDecline = recent != null && prior != null && prior - recent >= 1;

  let score = 100;
  if (fatigueRatio >= 0.5) score -= 35;
  else if (fatigueRatio >= 0.3) score -= 20;
  else if (fatigueRatio >= 0.15) score -= 10;

  if (ratingDecline) score -= 20;
  if (recent != null && recent < 6) score -= 15;

  score = clampScore(score);
  const severity = severityFromScore(score);

  if (severity === "alert" || severity === "watch") {
    return {
      readinessContribution: score,
      insight: {
        ruleId: "fatigue",
        severity,
        title: severity === "alert" ? "Fatigue signals are elevated" : "Early fatigue signs detected",
        explanation:
          fatigueRatio > 0
            ? `${Math.round(fatigueRatio * 100)}% of recorded horse feelings indicate tired, tense, or flat responses.${ratingDecline ? ` Recent rider ratings dropped from ${prior?.toFixed(1)} to ${recent?.toFixed(1)}.` : ""}`
            : `Recent rider ratings have declined to an average of ${recent?.toFixed(1)}.`,
        recommendation:
          "Schedule lighter flatwork or active rest, reduce jumping volume, and monitor horse feeling after each session.",
      },
    };
  }

  return {
    readinessContribution: score,
    insight: {
      ruleId: "fatigue",
      severity: "positive",
      title: "Fatigue levels look manageable",
      explanation: "Horse feeling data and recent ratings do not show sustained fatigue stress.",
      recommendation: "Maintain current intensity while continuing to log horse feeling after each session.",
    },
  };
}

export const fatigueRule: RuleModule = {
  id: "fatigue",
  evaluate: evaluateFatigue,
};
