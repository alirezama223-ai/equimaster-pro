import { daysBetween, isOverdue, todayIsoDate } from "@/app/lib/health/format";
import type { HealthRuleModule, HealthRuleModuleResult } from "@/app/lib/health/rules/helpers";
import type { HorseHealthSnapshot } from "@/app/types/health";

function evaluateOverdueFarrier(snapshot: HorseHealthSnapshot): HealthRuleModuleResult {
  const visit = snapshot.latestFarrierVisit;

  if (!visit) {
    return {
      healthContribution: 65,
      alert: {
        ruleId: "overdue_farrier",
        severity: "info",
        title: "No farrier history recorded",
        explanation: "Farrier visit dates have not been logged for this horse.",
        recommendation: "Add your most recent farrier visit and set the next due date.",
      },
    };
  }

  if (isOverdue(visit.nextDueDate)) {
    const daysLate = visit.nextDueDate
      ? daysBetween(visit.nextDueDate, todayIsoDate())
      : 0;
    return {
      healthContribution: Math.max(20, 60 - daysLate * 3),
      alert: {
        ruleId: "overdue_farrier",
        severity: daysLate >= 14 ? "alert" : "watch",
        title: "Farrier visit overdue",
        explanation: `Next farrier visit was due ${visit.nextDueDateLabel}.${daysLate > 0 ? ` ${daysLate} day(s) overdue.` : ""}`,
        recommendation: "Schedule a farrier appointment and reduce hard work until hooves are trimmed.",
      },
    };
  }

  return {
    healthContribution: 100,
    alert: {
      ruleId: "overdue_farrier",
      severity: "positive",
      title: "Farrier schedule on track",
      explanation: visit.nextDueDate
        ? `Next farrier visit due ${visit.nextDueDateLabel}.`
        : `Last visit recorded ${visit.visitDateLabel} with no due date set.`,
      recommendation: visit.nextDueDate
        ? "Maintain your regular trimming or shoeing interval."
        : "Set a next due date on your farrier records for proactive alerts.",
    },
  };
}

export const overdueFarrierRule: HealthRuleModule = {
  id: "overdue_farrier",
  evaluate: evaluateOverdueFarrier,
};
