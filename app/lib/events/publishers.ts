import type { PublishHorseEventInput } from "@/app/types/events";
import type { RuleEvaluationResult } from "@/app/types/training-analytics";
import type { HealthEvaluationResult } from "@/app/types/health";

const LOW_READINESS_THRESHOLD = 50;

export function buildRuleEngineEvents(
  horseId: string,
  ruleEvaluation: RuleEvaluationResult
): PublishHorseEventInput[] {
  const events: PublishHorseEventInput[] = [];
  const combinedScore = ruleEvaluation.combinedReadinessScore ?? ruleEvaluation.readinessScore;

  const workloadInsight = ruleEvaluation.insights.find((insight) => insight.ruleId === "workload");
  if (
    workloadInsight &&
    (workloadInsight.severity === "alert" || workloadInsight.severity === "watch")
  ) {
    events.push({
      horseId,
      eventType: "HIGH_WORKLOAD",
      severity: workloadInsight.severity,
      title: workloadInsight.title,
      description: `${workloadInsight.explanation} ${workloadInsight.recommendation}`,
      sourceModule: "rule_engine",
      dedupeKey: "rule:high_workload",
    });
  }

  if (combinedScore < LOW_READINESS_THRESHOLD) {
    events.push({
      horseId,
      eventType: "LOW_READINESS",
      severity: combinedScore < 35 ? "alert" : "watch",
      title: "Low horse readiness score",
      description: `Combined readiness score is ${combinedScore}/100. Review training load and health alerts before intensive work.`,
      sourceModule: "rule_engine",
      dedupeKey: "rule:low_readiness",
    });
  }

  const recoveryInsight = ruleEvaluation.insights.find((insight) => insight.ruleId === "recovery");
  if (
    recoveryInsight &&
    (recoveryInsight.severity === "alert" || recoveryInsight.severity === "watch")
  ) {
    events.push({
      horseId,
      eventType: "RECOVERY_RECOMMENDED",
      severity: recoveryInsight.severity,
      title: recoveryInsight.title,
      description: `${recoveryInsight.explanation} ${recoveryInsight.recommendation}`,
      sourceModule: "rule_engine",
      dedupeKey: "rule:recovery_recommended",
    });
  }

  const farrierAlert = ruleEvaluation.healthAlerts.find(
    (alert) => alert.ruleId === "overdue_farrier" && alert.severity !== "positive"
  );
  if (farrierAlert && (farrierAlert.severity === "alert" || farrierAlert.severity === "watch")) {
    events.push({
      horseId,
      eventType: "FARRIER_DUE",
      severity: farrierAlert.severity,
      title: farrierAlert.title,
      description: `${farrierAlert.explanation} ${farrierAlert.recommendation}`,
      sourceModule: "rule_engine",
      dedupeKey: "rule:farrier_due",
    });
  }

  const vaccinationAlert = ruleEvaluation.healthAlerts.find(
    (alert) => alert.ruleId === "overdue_vaccination" && alert.severity !== "positive"
  );
  if (
    vaccinationAlert &&
    (vaccinationAlert.severity === "alert" || vaccinationAlert.severity === "watch")
  ) {
    events.push({
      horseId,
      eventType: "VACCINATION_DUE",
      severity: vaccinationAlert.severity,
      title: vaccinationAlert.title,
      description: `${vaccinationAlert.explanation} ${vaccinationAlert.recommendation}`,
      sourceModule: "rule_engine",
      dedupeKey: "rule:vaccination_due",
    });
  }

  return events;
}

export function buildHealthModuleEvents(
  horseId: string,
  evaluation: HealthEvaluationResult
): PublishHorseEventInput[] {
  const events: PublishHorseEventInput[] = [];

  for (const alert of evaluation.alerts) {
    if (alert.severity !== "alert" && alert.severity !== "watch") continue;

    let eventType: PublishHorseEventInput["eventType"] | null = null;
    switch (alert.ruleId) {
      case "fever":
        eventType = "FEVER_DETECTED";
        break;
      case "lameness":
        eventType = "LAMENESS_DETECTED";
        break;
      case "active_injury":
        eventType = "ACTIVE_INJURY";
        break;
      case "overdue_farrier":
        eventType = "FARRIER_OVERDUE";
        break;
      case "overdue_vaccination":
        eventType = "VACCINATION_OVERDUE";
        break;
      default:
        break;
    }

    if (!eventType) continue;

    events.push({
      horseId,
      eventType,
      severity: alert.severity,
      title: alert.title,
      description: `${alert.explanation} ${alert.recommendation}`,
      sourceModule: "health",
      dedupeKey: `health:${alert.ruleId}`,
    });
  }

  return events;
}

export function buildAnalyticsModuleEvents(
  horseId: string,
  ruleEvaluation: RuleEvaluationResult
): PublishHorseEventInput[] {
  const combinedScore = ruleEvaluation.combinedReadinessScore ?? ruleEvaluation.readinessScore;

  if (combinedScore >= 85) {
    return [];
  }

  if (combinedScore < 50) {
    return [
      {
        horseId,
        eventType: "READINESS_UPDATED",
        severity: "watch",
        title: "Readiness score is low",
        description: `Analytics recorded a combined readiness score of ${combinedScore}/100. Review alerts before intensive training.`,
        sourceModule: "analytics",
        dedupeKey: "analytics:readiness:low",
      },
    ];
  }

  return [
    {
      horseId,
      eventType: "READINESS_UPDATED",
      severity: "info",
      title: "Readiness score updated",
      description: `Analytics recorded a combined readiness score of ${combinedScore}/100 for this horse.`,
      sourceModule: "analytics",
      dedupeKey: "analytics:readiness:moderate",
    },
  ];
}

export function buildTrainingSessionCompletedEvent(
  horseId: string,
  sessionId: string,
  sessionTitle: string
): PublishHorseEventInput {
  return {
    horseId,
    eventType: "SESSION_COMPLETED",
    severity: "positive",
    title: "Training session completed",
    description: `${sessionTitle} was marked complete.`,
    sourceModule: "training",
    dedupeKey: `training:session:${sessionId}`,
  };
}
