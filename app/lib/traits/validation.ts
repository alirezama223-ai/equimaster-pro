import { TRAIT_SCORE_MAX, TRAIT_SCORE_MIN, TraitAssessmentConfidence, TraitKey, TraitSourceType } from "@/app/types/traits";
import { getTraitDefinition, isValidTraitKey } from "@/app/lib/traits/constants";
import { ADMIN_ONLY_SOURCE_TYPES, MANAGER_SUBMITTABLE_SOURCE_TYPES } from "@/app/lib/traits/evidence-labels";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_CONFIDENCES: TraitAssessmentConfidence[] = ["low", "medium", "high"];

const ALL_SOURCE_TYPES: TraitSourceType[] = [
  "owner_reported",
  "breeder_reported",
  "admin_assessed",
  "verified_record",
  "performance_data",
  "offspring_data",
];

export function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export function validateTraitScore(score: number): string | null {
  if (!Number.isFinite(score)) return "Score must be a valid number.";
  if (score < TRAIT_SCORE_MIN || score > TRAIT_SCORE_MAX) {
    return `Trait score must be between ${TRAIT_SCORE_MIN} and ${TRAIT_SCORE_MAX}.`;
  }
  return null;
}

export function validateTraitConfidence(confidence: string): confidence is TraitAssessmentConfidence {
  return VALID_CONFIDENCES.includes(confidence as TraitAssessmentConfidence);
}

export function validateTraitKey(traitKey: string): boolean {
  return isValidTraitKey(traitKey);
}

export function isAllowedManagerSourceType(sourceType: TraitSourceType): boolean {
  return MANAGER_SUBMITTABLE_SOURCE_TYPES.includes(sourceType);
}

export function isAllowedAdminSourceType(sourceType: TraitSourceType): boolean {
  return ALL_SOURCE_TYPES.includes(sourceType);
}

export function isAllowedAdminOnlySourceType(sourceType: TraitSourceType): boolean {
  return ADMIN_ONLY_SOURCE_TYPES.includes(sourceType);
}

export function getAllowedAdminSourceTypesForTrait(traitKey: TraitKey): TraitSourceType[] {
  const definition = getTraitDefinition(traitKey);
  return definition.allowedSourceTypes.filter((sourceType) =>
    ADMIN_ONLY_SOURCE_TYPES.includes(sourceType)
  );
}

/** Admin edit may retain manager source types on existing manager-submitted rows. */
export function getEditableSourceTypesForTrait(
  traitKey: TraitKey,
  currentSourceType?: TraitSourceType
): TraitSourceType[] {
  const definition = getTraitDefinition(traitKey);
  const adminSources = getAllowedAdminSourceTypesForTrait(traitKey);
  if (currentSourceType && MANAGER_SUBMITTABLE_SOURCE_TYPES.includes(currentSourceType)) {
    const managerSources = definition.allowedSourceTypes.filter((sourceType) =>
      MANAGER_SUBMITTABLE_SOURCE_TYPES.includes(sourceType)
    );
    return [...new Set([...managerSources, ...adminSources])];
  }
  return adminSources.length > 0 ? adminSources : definition.allowedSourceTypes;
}

export function validateAdminSourceForTrait(traitKey: string, sourceType: TraitSourceType): string | null {
  if (!validateTraitKey(traitKey)) return "Invalid trait key.";
  if (!isAllowedAdminOnlySourceType(sourceType)) {
    return "Source type is not permitted for admin structured entry.";
  }
  const definition = getTraitDefinition(traitKey as TraitKey);
  if (!definition.allowedSourceTypes.includes(sourceType)) {
    return `Source type is not allowed for ${definition.label}.`;
  }
  return null;
}

export function validateEditableSourceForTrait(traitKey: string, sourceType: TraitSourceType): string | null {
  if (!validateTraitKey(traitKey)) return "Invalid trait key.";
  const definition = getTraitDefinition(traitKey as TraitKey);
  if (!definition.allowedSourceTypes.includes(sourceType)) {
    return `Source type is not allowed for ${definition.label}.`;
  }
  if (MANAGER_SUBMITTABLE_SOURCE_TYPES.includes(sourceType)) {
    return null;
  }
  return validateAdminSourceForTrait(traitKey, sourceType);
}

export function validateManagerSubmission(input: {
  pedigreeHorseId: string;
  traitKey: string;
  score: number;
  confidence: string;
}): string | null {
  if (!isUuid(input.pedigreeHorseId)) return "Invalid horse reference.";
  if (!validateTraitKey(input.traitKey)) return "Invalid trait key.";
  const scoreError = validateTraitScore(input.score);
  if (scoreError) return scoreError;
  if (!validateTraitConfidence(input.confidence)) return "Invalid confidence level.";
  return null;
}

export function validateAdminSubmission(input: {
  pedigreeHorseId: string;
  traitKey: string;
  score: number;
  confidence: string;
  sourceType: TraitSourceType;
}): string | null {
  const baseError = validateManagerSubmission(input);
  if (baseError) return baseError;
  return validateAdminSourceForTrait(input.traitKey, input.sourceType);
}

export function validateAdminUpdate(input: {
  assessmentId: string;
  traitKey: string;
  score: number;
  confidence: string;
  sourceType: TraitSourceType;
}): string | null {
  if (!isUuid(input.assessmentId)) return "Invalid assessment ID.";
  if (!validateTraitKey(input.traitKey)) return "Invalid trait key.";
  const scoreError = validateTraitScore(input.score);
  if (scoreError) return scoreError;
  if (!validateTraitConfidence(input.confidence)) return "Invalid confidence level.";
  return validateEditableSourceForTrait(input.traitKey, input.sourceType);
}

export function assertClientCannotSetVerified(verified: boolean | undefined): void {
  if (verified === true) {
    throw new Error("Client-supplied verified status is not permitted.");
  }
}
