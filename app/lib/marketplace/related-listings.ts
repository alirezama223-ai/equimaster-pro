import type { HorseListingRow } from "@/app/types/horse-listing";

/** Seed attributes used by Smart Related Horses v1 scoring. */
export type RelatedListingSeed = Pick<
  HorseListingRow,
  | "id"
  | "discipline"
  | "breed"
  | "gender"
  | "level"
  | "price"
  | "price_on_request"
  | "age"
>;

const PRICE_PROXIMITY_RATIO = 0.25;
const AGE_PROXIMITY_YEARS = 2;

/** Candidate pool size per fetch branch (discipline + recent fallback). */
export const RELATED_CANDIDATE_POOL = 50;

export const RELATED_LISTINGS_LIMIT = 4;

export function isPriceProximate(
  seed: Pick<RelatedListingSeed, "price" | "price_on_request">,
  candidate: Pick<HorseListingRow, "price" | "price_on_request">
): boolean {
  if (seed.price_on_request && candidate.price_on_request) {
    return true;
  }

  if (seed.price_on_request || candidate.price_on_request) {
    return false;
  }

  if (seed.price == null || candidate.price == null) {
    return false;
  }

  const base = Math.max(seed.price, candidate.price);
  if (base === 0) {
    return seed.price === candidate.price;
  }

  return Math.abs(seed.price - candidate.price) / base <= PRICE_PROXIMITY_RATIO;
}

export function isAgeProximate(seedAge: number, candidateAge: number): boolean {
  return Math.abs(seedAge - candidateAge) <= AGE_PROXIMITY_YEARS;
}

/**
 * Smart Related Horses v1 score (max 100):
 * discipline +40, breed +25, gender +10, level +10, price proximity +10, age proximity +5.
 */
export function scoreRelatedListing(
  seed: RelatedListingSeed,
  candidate: HorseListingRow
): number {
  let score = 0;

  if (candidate.discipline === seed.discipline) score += 40;
  if (candidate.breed === seed.breed) score += 25;
  if (candidate.gender === seed.gender) score += 10;
  if (candidate.level === seed.level) score += 10;
  if (isPriceProximate(seed, candidate)) score += 10;
  if (isAgeProximate(seed.age, candidate.age)) score += 5;

  return score;
}

function publishedAtTime(value: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Dedupes candidates, ranks by Smart Related score, then `published_at` (newer first).
 * Weaker / zero-score active listings remain available as fill-in fallbacks.
 */
export function rankRelatedListings(
  seed: RelatedListingSeed,
  candidates: HorseListingRow[],
  limit = RELATED_LISTINGS_LIMIT
): HorseListingRow[] {
  const seen = new Set<string>();
  const unique: HorseListingRow[] = [];

  for (const candidate of candidates) {
    if (candidate.id === seed.id) continue;
    if (candidate.status !== "active") continue;
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    unique.push(candidate);
  }

  unique.sort((a, b) => {
    const scoreDiff = scoreRelatedListing(seed, b) - scoreRelatedListing(seed, a);
    if (scoreDiff !== 0) return scoreDiff;
    return publishedAtTime(b.published_at) - publishedAtTime(a.published_at);
  });

  return unique.slice(0, Math.max(0, limit));
}
