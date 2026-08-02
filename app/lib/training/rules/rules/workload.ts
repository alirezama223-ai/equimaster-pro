import { formatDurationMinutes } from "@/app/lib/training/format";
import {
  average,
  clampScore,
  severityFromScore,
  sumTrainingLoad,
} from "@/app/lib/training/rules/helpers";
import type { RuleEvaluationContext, RuleModule, RuleModuleResult } from "@/app/lib/training/rules/types";

function evaluateWorkload(context: RuleEvaluationContext): RuleModuleResult {
  const { summary, trainingLoad } = context;

  if (summary.totalSessions === 0) {
    return {
      readinessContribution: 50,
      insight: {
        ruleId: "workload",
        severity: "info",
        title: "No workload history yet",
        explanation: "Training load cannot be assessed without completed sessions.",
        recommendation: "Complete sessions consistently to build a reliable workload profile.",
      },
    };
  }

  const lastSevenDays = trainingLoad.slice(-7);
  const lastFourteenDays = trainingLoad.slice(-14);
  const sevenDayLoad = sumTrainingLoad(lastSevenDays);

  const durationSamples: number[] = [];
  for (const day of lastFourteenDays) {
    if (day.sessionCount <= 0) continue;
    const dayAverage = day.totalDurationMinutes / day.sessionCount;
    for (let index = 0; index < day.sessionCount; index += 1) {
      durationSamples.push(dayAverage);
    }
  }
  const avgSessionDuration = average(durationSamples);

  let score = 100;
  if (sevenDayLoad.sessionCount >= 6) score -= 40;
  else if (sevenDayLoad.sessionCount >= 5) score -= 25;
  else if (sevenDayLoad.sessionCount >= 4) score -= 10;

  if (sevenDayLoad.totalDurationMinutes >= 360) score -= 25;
  else if (sevenDayLoad.totalDurationMinutes >= 270) score -= 15;

  if (avgSessionDuration != null && avgSessionDuration >= 60) score -= 15;

  score = clampScore(score);
  const severity = severityFromScore(score);

  if (severity === "alert" || severity === "watch") {
    return {
      readinessContribution: score,
      insight: {
        ruleId: "workload",
        severity,
        title: severity === "alert" ? "Training workload is high" : "Workload is building up",
        explanation: `${sevenDayLoad.sessionCount} completed session(s) and ${sevenDayLoad.totalDurationMinutes} minutes logged in the last 7 days.${avgSessionDuration != null ? ` Average session length is ${formatDurationMinutes(Math.round(avgSessionDuration))}.` : ""}`,
        recommendation:
          "Reduce session frequency or duration this week and prioritize quality over volume.",
      },
    };
  }

  return {
    readinessContribution: score,
    insight: {
      ruleId: "workload",
      severity: "positive",
      title: "Workload is within a sustainable range",
      explanation: `${sevenDayLoad.sessionCount} session(s) and ${sevenDayLoad.totalDurationMinutes} minutes over the last 7 days appear balanced.`,
      recommendation: "Keep progressive load changes gradual—no more than one extra session per week.",
    },
  };
}

export const workloadRule: RuleModule = {
  id: "workload",
  evaluate: evaluateWorkload,
};
