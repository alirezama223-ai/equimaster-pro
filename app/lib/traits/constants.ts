import { TraitDefinition, TraitKey, TraitSourceType } from "@/app/types/traits";
import { TRAIT_CATALOG, TRAIT_CATALOG_MAP, getTraitsByCategoryFromCatalog } from "@/app/lib/traits/catalog";
import { MANAGER_SUBMITTABLE_SOURCE_TYPES } from "@/app/lib/traits/evidence-labels";

export const TRAIT_DISCLAIMER =
  "Trait and breeding-goal analysis is a decision-support tool based on available structured evidence. It does not predict or guarantee inheritance, health, temperament, performance, or offspring quality. Genetic testing, veterinary evaluation, reproductive assessment, and professional breeding judgment remain essential.";

/** @deprecated Use TRAIT_CATALOG — kept as alias for backward compatibility. */
export const TRAIT_DEFINITIONS: TraitDefinition[] = TRAIT_CATALOG;

export const TRAIT_DEFINITION_MAP = TRAIT_CATALOG_MAP;

export { MANAGER_SUBMITTABLE_SOURCE_TYPES };

export const SOURCE_TYPE_WEIGHTS: Record<TraitSourceType, number> = {
  verified_record: 1,
  admin_assessed: 0.95,
  performance_data: 0.9,
  offspring_data: 0.85,
  breeder_reported: 0.65,
  owner_reported: 0.55,
};

/**
 * Verified evidence weight boost applied during aggregation.
 * Verification is separate from confidence: verified=true does NOT force confidence=high.
 * @see app/lib/traits/aggregate.ts assessmentWeight()
 */
export const VERIFIED_ASSESSMENT_MULTIPLIER = 1.15;

/** Minimum aggregated confidence score (0–1) before a trait is assessable. */
export const MIN_TRAIT_ASSESSABLE_CONFIDENCE = 0.35;

/** Score threshold for calling a supported strength. */
export const STRENGTH_SCORE_THRESHOLD = 4;

/** Score threshold for calling a supported improvement area. */
export const WEAKNESS_SCORE_THRESHOLD = 2.5;

/** Minimum share of selected goals assessable on BOTH horses before numeric Goal Match Score. */
export const MIN_GOAL_COVERAGE_RATIO = 0.5;

export const GOAL_PRIORITY_WEIGHT = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

export const TRAIT_PROFILE_CONFIDENCE_ORDER = {
  high: 0,
  moderate: 1,
  limited: 2,
  insufficient_data: 3,
} as const;

export function isValidTraitKey(value: string): value is TraitKey {
  return TRAIT_CATALOG_MAP.has(value as TraitKey);
}

export function getTraitDefinition(key: TraitKey): TraitDefinition {
  return TRAIT_CATALOG_MAP.get(key)!;
}

export function getTraitsByCategory() {
  return getTraitsByCategoryFromCatalog();
}
