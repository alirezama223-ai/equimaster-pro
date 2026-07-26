export const RECOMMENDATION_DISCLAIMER =
  "Stallion Match is a pedigree-based decision-support tool. Rankings reflect available ancestry data and configured filters, not a prediction or guarantee of genetic, health, performance, temperament, or breeding outcomes. Veterinary, reproductive, genetic, and professional breeding evaluation remain essential.";

export const MAX_RECOMMENDATION_CANDIDATES = 50;

export const CLOSE_RELATIONSHIP_WEIGHT = 35;
export const COMMON_ANCESTOR_WEIGHT = 25;
export const DATA_CONFIDENCE_WEIGHT = 20;
export const PEDIGREE_DIVERSITY_WEIGHT = 20;

export const COMPATIBILITY_SCORE_MAX =
  CLOSE_RELATIONSHIP_WEIGHT +
  COMMON_ANCESTOR_WEIGHT +
  DATA_CONFIDENCE_WEIGHT +
  PEDIGREE_DIVERSITY_WEIGHT;

/**
 * Minimum conservative pair coverage (min of mare & stallion completeness %)
 * required before absence-of-finding can contribute to a numeric Compatibility Score.
 *
 * Rationale: below ~15%, at least one side lacks enough ancestor slots for reliable
 * exclusion of close relationships, shared ancestors, or diversity assessment.
 * Phase 9 analyzes 5 generations (~62 expected ancestor slots per side).
 */
export const MIN_SCOREABLE_PAIR_COVERAGE = 15;

/** Minimum multiplier applied to evidence-dependent dimensions at partial coverage. */
export const MIN_EVIDENCE_FACTOR = 0.35;

export const CONFIDENCE_ORDER = {
  high: 0,
  moderate: 1,
  limited: 2,
} as const;

export const RISK_ORDER = {
  low_concern: 0,
  review: 1,
  high_concern: 2,
  insufficient_data: 3,
} as const;
