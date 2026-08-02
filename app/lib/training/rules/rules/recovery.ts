import { clampScore, daysSinceDate, severityFromScore, sumTrainingLoad } from "@/app/lib/training/rules/helpers";
import type { RuleEvaluationContext, RuleModule, RuleModuleResult } from "@/app/lib/training/rules/types";

function evaluateRecovery(context: RuleEvaluationContext): RuleModuleResult {
  const { summary, trainingLoad } = context;

  if (summary.totalSessions === 0) {
    return {
      readinessContribution: 50,
      insight: {
        ruleId: "recovery",
        severity: "info",
        title: "Recovery status unknown",
        explanation: "Recovery analysis requires completed session history.",
        recommendation: "After several sessions, recovery gaps and rest patterns will appear here.",
      },
    };
  }

  const daysSinceLastSession = daysSinceDate(summary.lastSessionDate);
  const lastSevenDays = sumTrainingLoad(trainingLoad.slice(-7));
  const lastThreeDays = sumTrainingLoad(trainingLoad.slice(-3));

  let score = 75;

  if (daysSinceLastSession == null) {
    score = 50;
  } else if (daysSinceLastSession === 0 && lastThreeDays.sessionCount >= 3) {
    score -= 25;
  } else if (daysSinceLastSession === 1 && lastSevenDays.sessionCount >= 5) {
    score -= 20;
  } else if (daysSinceLastSession >= 2 && daysSinceLastSession <= 4 && lastSevenDays.sessionCount >= 4) {
    score += 15;
  } else if (daysSinceLastSession > 7) {
    score -= 15;
  } else if (daysSinceLastSession >= 1 && daysSinceLastSession <= 2) {
    score += 10;
  }

  score = clampScore(score);
  const severity = severityFromScore(score);

  if (severity === "alert" || severity === "watch") {
    const isOvertraining = daysSinceLastSession != null && daysSinceLastSession <= 1 && lastSevenDays.sessionCount >= 5;
    return {
      readinessContribution: score,
      insight: {
        ruleId: "recovery",
        severity,
        title: isOvertraining ? "Insufficient recovery between sessions" : "Recovery window needs attention",
        explanation: isOvertraining
          ? `${lastSevenDays.sessionCount} sessions in 7 days with training as recent as ${daysSinceLastSession === 0 ? "today" : "yesterday"}.`
          : daysSinceLastSession != null && daysSinceLastSession > 7
            ? `Last completed session was ${daysSinceLastSession} days ago.`
            : "Recent training load has not been followed by enough rest days.",
        recommendation: isOvertraining
          ? "Insert at least one full rest or light flatwork day before the next intensive session."
          : "Plan a short re-entry session to restore rhythm without jumping straight back to peak load.",
      },
    };
  }

  return {
    readinessContribution: score,
    insight: {
      ruleId: "recovery",
      severity: "positive",
      title: "Recovery timing looks appropriate",
      explanation:
        daysSinceLastSession != null
          ? `Last session was ${daysSinceLastSession === 0 ? "today" : `${daysSinceLastSession} day(s) ago`} with manageable weekly volume.`
          : "Session spacing supports adequate recovery.",
      recommendation: "Keep alternating harder sessions with lighter days to preserve freshness.",
    },
  };
}

export const recoveryRule: RuleModule = {
  id: "recovery",
  evaluate: evaluateRecovery,
};
