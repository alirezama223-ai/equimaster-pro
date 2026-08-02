import { daysBetween, todayIsoDate } from "@/app/lib/health/format";
import type { HealthRuleModule, HealthRuleModuleResult } from "@/app/lib/health/rules/helpers";
import type { HorseHealthSnapshot } from "@/app/types/health";

function evaluateOverdueVaccination(snapshot: HorseHealthSnapshot): HealthRuleModuleResult {
  const overdue = snapshot.overdueVaccinations;

  if (overdue.length === 0) {
    if (snapshot.vaccinationRecordCount === 0) {
      return {
        healthContribution: 70,
        alert: {
          ruleId: "overdue_vaccination",
          severity: "info",
          title: "No vaccination records",
          explanation: "Vaccination history has not been logged for this horse.",
          recommendation: "Add vaccination records with due dates to enable overdue alerts.",
        },
      };
    }

    return {
      healthContribution: 100,
      alert: {
        ruleId: "overdue_vaccination",
        severity: "positive",
        title: "Vaccinations up to date",
        explanation: "No overdue vaccination due dates were found.",
        recommendation: "Keep vaccination records current after each booster.",
      },
    };
  }

  const mostOverdue = [...overdue].sort((left, right) => {
    if (!left.nextDueDate) return 1;
    if (!right.nextDueDate) return -1;
    return left.nextDueDate.localeCompare(right.nextDueDate);
  })[0];

  const daysLate = mostOverdue.nextDueDate
    ? daysBetween(mostOverdue.nextDueDate, todayIsoDate())
    : 0;

  const vaccineList = overdue.map((item) => item.vaccineName).join(", ");

  return {
    healthContribution: Math.max(15, 55 - daysLate * 2),
    alert: {
      ruleId: "overdue_vaccination",
      severity: daysLate >= 30 ? "alert" : "watch",
      title: overdue.length === 1 ? "Vaccination overdue" : `${overdue.length} vaccinations overdue`,
      explanation: `${vaccineList} ${overdue.length === 1 ? "is" : "are"} past due.${mostOverdue.nextDueDateLabel ? ` Earliest due date was ${mostOverdue.nextDueDateLabel}.` : ""}`,
      recommendation: "Contact your veterinarian to schedule boosters before travel or competition.",
    },
  };
}

export const overdueVaccinationRule: HealthRuleModule = {
  id: "overdue_vaccination",
  evaluate: evaluateOverdueVaccination,
};
