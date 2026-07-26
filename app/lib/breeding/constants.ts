/** Maximum ancestor generations analyzed (parents = generation 1). */
export const BREEDING_MAX_GENERATIONS = 5;

export const BREEDING_DISCLAIMER =
  "Pedigree analysis is a decision-support tool and does not replace veterinary examination, genetic testing, reproductive evaluation, or professional breeding judgment.";

export const GENERATION_NUMBERING_EXPLANATION =
  "Generation 1 = parents, Generation 2 = grandparents, Generation 3 = great-grandparents, and so on. Linebreeding notation (e.g. 3×4) means the shared ancestor appears in generation 3 on the stallion side and generation 4 on the mare side.";

export const SEVERITY_LABELS = {
  very_close: "Very Close",
  close: "Close",
  moderate: "Moderate",
  distant: "Distant",
} as const;
