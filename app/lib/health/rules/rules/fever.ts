import { FEVER_THRESHOLD_CELSIUS } from "@/app/lib/health/format";
import type { HealthRuleModule, HealthRuleModuleResult } from "@/app/lib/health/rules/helpers";
import type { HorseHealthSnapshot } from "@/app/types/health";

function evaluateFever(snapshot: HorseHealthSnapshot): HealthRuleModuleResult {
  const check = snapshot.latestCheck;

  if (!check) {
    return {
      healthContribution: 75,
      alert: {
        ruleId: "fever",
        severity: "info",
        title: "No recent temperature data",
        explanation: "Log a daily health check to monitor for fever.",
        recommendation: "Record temperature and fever observations during your next daily check.",
      },
    };
  }

  const elevatedTemp =
    check.temperatureCelsius != null && check.temperatureCelsius >= FEVER_THRESHOLD_CELSIUS;
  const feverDetected = check.feverObserved || elevatedTemp;

  if (feverDetected) {
    const tempDetail =
      check.temperatureCelsius != null
        ? ` Temperature recorded at ${check.temperatureCelsius.toFixed(1)}°C.`
        : "";
    return {
      healthContribution: 15,
      alert: {
        ruleId: "fever",
        severity: "alert",
        title: "Fever detected",
        explanation: `Latest health check on ${check.checkDateLabel} indicates fever.${tempDetail}`,
        recommendation: "Contact your veterinarian, monitor hydration, and avoid training until cleared.",
      },
    };
  }

  return {
    healthContribution: 100,
    alert: {
      ruleId: "fever",
      severity: "positive",
      title: "No fever indicators",
      explanation: `Latest check on ${check.checkDateLabel} shows no fever signs.`,
      recommendation: "Continue daily temperature and wellness checks.",
    },
  };
}

export const feverRule: HealthRuleModule = {
  id: "fever",
  evaluate: evaluateFever,
};
