import { TraitAssessmentConfidence, TraitProfileConfidenceLevel, TraitSourceType } from "@/app/types/traits";

/** Non-admin authorized managers may submit only these source types. */
export const MANAGER_SUBMITTABLE_SOURCE_TYPES: TraitSourceType[] = [
  "owner_reported",
  "breeder_reported",
];

/** User-facing labels for evidence source types. Provenance must remain visible. */
export const SOURCE_TYPE_LABELS: Record<TraitSourceType, string> = {
  owner_reported: "Owner reported",
  breeder_reported: "Breeder / stud farm reported",
  admin_assessed: "Admin assessed",
  verified_record: "Verified record",
  performance_data: "Performance data",
  offspring_data: "Offspring data",
};

export const SOURCE_TYPE_DESCRIPTIONS: Record<TraitSourceType, string> = {
  owner_reported: "Submitted by an authorized owner or manager. Not automatically verified.",
  breeder_reported: "Submitted by an authorized breeder or stud farm. Not automatically verified.",
  admin_assessed: "Structured assessment entered by an EquiMaster Pro admin.",
  verified_record: "Supported by documented records reviewed by an admin.",
  performance_data: "Derived from structured performance or competition evidence.",
  offspring_data: "Derived from structured offspring or progeny evidence.",
};

export const CONFIDENCE_INPUT_LABELS: Record<TraitAssessmentConfidence, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const AGGREGATED_CONFIDENCE_LABELS: Record<TraitProfileConfidenceLevel, string> = {
  high: "High evidence confidence",
  moderate: "Moderate evidence confidence",
  limited: "Limited evidence confidence",
  insufficient_data: "Insufficient evidence",
};

/** Admin-only source types for structured production entry. */
export const ADMIN_ONLY_SOURCE_TYPES: TraitSourceType[] = [
  "admin_assessed",
  "verified_record",
  "performance_data",
  "offspring_data",
];

export function formatSourceType(sourceType: TraitSourceType): string {
  return SOURCE_TYPE_LABELS[sourceType] ?? sourceType.replace(/_/g, " ");
}

export function formatAggregatedConfidence(level: TraitProfileConfidenceLevel): string {
  return AGGREGATED_CONFIDENCE_LABELS[level] ?? level.replace(/_/g, " ");
}
