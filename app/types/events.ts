export type EventSeverity = "info" | "watch" | "alert" | "positive";

export type EventSourceModule = "training" | "health" | "analytics" | "rule_engine";

export type RuleEngineEventType =
  | "HIGH_WORKLOAD"
  | "LOW_READINESS"
  | "FARRIER_DUE"
  | "VACCINATION_DUE"
  | "RECOVERY_RECOMMENDED";

export type HealthEventType =
  | "FEVER_DETECTED"
  | "LAMENESS_DETECTED"
  | "ACTIVE_INJURY"
  | "FARRIER_OVERDUE"
  | "VACCINATION_OVERDUE";

export type TrainingEventType = "SESSION_COMPLETED" | "SESSION_SKIPPED";

export type AnalyticsEventType = "READINESS_UPDATED";

export type HorseEventType =
  | RuleEngineEventType
  | HealthEventType
  | TrainingEventType
  | AnalyticsEventType;

export type HorseEvent = {
  id: string;
  horseId: string;
  horseName: string | null;
  eventType: HorseEventType;
  severity: EventSeverity;
  title: string;
  description: string;
  sourceModule: EventSourceModule;
  dedupeKey: string;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  createdAtLabel: string;
};

export type PublishHorseEventInput = {
  horseId: string;
  eventType: HorseEventType;
  severity: EventSeverity;
  title: string;
  description: string;
  sourceModule: EventSourceModule;
  dedupeKey: string;
};

export type HorseEventTimeline = {
  events: HorseEvent[];
  unresolvedCount: number;
};

export type NotificationCenterData = {
  events: HorseEvent[];
  unresolvedCount: number;
  alertCount: number;
};

export type TodaysAlertsData = {
  alerts: HorseEvent[];
  alertCount: number;
};

export const RULE_ENGINE_EVENT_TYPES: RuleEngineEventType[] = [
  "HIGH_WORKLOAD",
  "LOW_READINESS",
  "FARRIER_DUE",
  "VACCINATION_DUE",
  "RECOVERY_RECOMMENDED",
];
