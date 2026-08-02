import type { HealthRuleModule, HealthRuleModuleResult } from "@/app/lib/health/rules/helpers";
import type { HorseHealthSnapshot } from "@/app/types/health";

function evaluateLameness(snapshot: HorseHealthSnapshot): HealthRuleModuleResult {
  const check = snapshot.latestCheck;
  const lamenessInCheck = check?.lamenessObserved ?? false;
  const lamenessInjuries = snapshot.activeInjuries.filter((injury) =>
    /leg|hoof|limb|shoulder|hock|stifle|fetlock|pastern|lameness/i.test(injury.bodyArea)
  );

  if (lamenessInCheck || lamenessInjuries.length > 0) {
    const sources: string[] = [];
    if (lamenessInCheck && check) {
      sources.push(`daily check on ${check.checkDateLabel}`);
    }
    if (lamenessInjuries.length > 0) {
      sources.push(`${lamenessInjuries.length} active limb-related injury record(s)`);
    }

    return {
      healthContribution: lamenessInCheck ? 20 : 35,
      alert: {
        ruleId: "lameness",
        severity: lamenessInCheck ? "alert" : "watch",
        title: lamenessInCheck ? "Lameness observed" : "Lameness risk from active injuries",
        explanation: `Lameness signals detected from ${sources.join(" and ")}.`,
        recommendation: "Rest the horse, consult your vet or farrier, and avoid jumping or hard work.",
      },
    };
  }

  if (!check) {
    return {
      healthContribution: 70,
      alert: {
        ruleId: "lameness",
        severity: "info",
        title: "Lameness baseline not established",
        explanation: "No recent daily health checks include lameness observations.",
        recommendation: "Log daily checks and note any gait or limb concerns.",
      },
    };
  }

  return {
    healthContribution: 100,
    alert: {
      ruleId: "lameness",
      severity: "positive",
      title: "No lameness indicators",
      explanation: `Latest check on ${check.checkDateLabel} shows no lameness.`,
      recommendation: "Keep monitoring gait during daily checks and turnout.",
    },
  };
}

export const lamenessRule: HealthRuleModule = {
  id: "lameness",
  evaluate: evaluateLameness,
};
