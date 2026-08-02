import type { HealthRuleModule, HealthRuleModuleResult } from "@/app/lib/health/rules/helpers";
import type { HorseHealthSnapshot } from "@/app/types/health";

function evaluateActiveInjury(snapshot: HorseHealthSnapshot): HealthRuleModuleResult {
  const active = snapshot.activeInjuries;

  if (active.length === 0) {
    return {
      healthContribution: 100,
      alert: {
        ruleId: "active_injury",
        severity: "positive",
        title: "No active injuries",
        explanation: "There are no open or recovering injury records.",
        recommendation: "Continue logging any new injuries promptly for accurate readiness tracking.",
      },
    };
  }

  const severeCount = active.filter((injury) => injury.severity === "severe").length;
  const moderateCount = active.filter((injury) => injury.severity === "moderate").length;
  const areas = active.map((injury) => injury.bodyArea).join(", ");

  let score = 70;
  if (severeCount > 0) score = 15;
  else if (moderateCount > 0) score = 35;
  else score = 55;

  return {
    healthContribution: score,
    alert: {
      ruleId: "active_injury",
      severity: severeCount > 0 ? "alert" : moderateCount > 0 ? "watch" : "watch",
      title: active.length === 1 ? "Active injury on file" : `${active.length} active injuries on file`,
      explanation: `Affected areas: ${areas}. Status includes active or recovering records.`,
      recommendation: "Follow vet treatment plans, update injury status when resolved, and adjust training load.",
    },
  };
}

export const activeInjuryRule: HealthRuleModule = {
  id: "active_injury",
  evaluate: evaluateActiveInjury,
};
