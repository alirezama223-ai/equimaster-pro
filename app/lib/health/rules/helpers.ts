import type {
  HealthAlert,
  HealthAlertSeverity,
  HealthEvaluationResult,
  HealthRuleId,
  HorseHealthSnapshot,
} from "@/app/types/health";

export type HealthRuleModuleResult = {
  healthContribution: number;
  alert: HealthAlert;
};

export type HealthRuleModule = {
  id: HealthRuleId;
  evaluate: (snapshot: HorseHealthSnapshot) => HealthRuleModuleResult;
};

export function clampHealthScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function severityFromHealthScore(score: number): HealthAlertSeverity {
  if (score >= 85) return "positive";
  if (score >= 65) return "info";
  if (score >= 45) return "watch";
  return "alert";
}

const SEVERITY_PRIORITY: Record<HealthAlertSeverity, number> = {
  alert: 0,
  watch: 1,
  info: 2,
  positive: 3,
};

export function selectPrimaryHealthAlert(alerts: HealthAlert[]): HealthAlert | null {
  if (alerts.length === 0) return null;

  return [...alerts].sort((left, right) => {
    const severityDiff = SEVERITY_PRIORITY[left.severity] - SEVERITY_PRIORITY[right.severity];
    if (severityDiff !== 0) return severityDiff;
    return left.ruleId.localeCompare(right.ruleId);
  })[0];
}

export function snapshotHasHealthData(snapshot: HorseHealthSnapshot): boolean {
  return (
    snapshot.latestCheck !== null ||
    snapshot.recentChecks.length > 0 ||
    snapshot.activeInjuries.length > 0 ||
    snapshot.latestFarrierVisit !== null ||
    snapshot.overdueVaccinations.length > 0 ||
    snapshot.activeMedications.length > 0 ||
    snapshot.recentVetVisits.length > 0
  );
}

export type CombinedReadinessResult = {
  trainingScore: number;
  healthScore: number | null;
  combinedReadinessScore: number;
  healthAlerts: HealthAlert[];
  primaryHealthAlert: HealthAlert | null;
};

export function combineReadinessScores(
  trainingScore: number,
  healthEvaluation: HealthEvaluationResult
): CombinedReadinessResult {
  if (!healthEvaluation.hasData) {
    return {
      trainingScore,
      healthScore: null,
      combinedReadinessScore: trainingScore,
      healthAlerts: healthEvaluation.alerts,
      primaryHealthAlert: healthEvaluation.primaryAlert,
    };
  }

  const combinedReadinessScore = clampHealthScore(
    Math.round(trainingScore * 0.6 + healthEvaluation.healthScore * 0.4)
  );

  return {
    trainingScore,
    healthScore: healthEvaluation.healthScore,
    combinedReadinessScore,
    healthAlerts: healthEvaluation.alerts,
    primaryHealthAlert: healthEvaluation.primaryAlert,
  };
}
