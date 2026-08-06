import { findBreedByName } from "@/app/lib/breeds";

/**
 * Curated European sport horse breeds — order used as tie-breaker when listing counts match.
 * Names must match entries in the breed registry catalog.
 */
export const CURATED_FEATURED_BREEDS = [
  "Holsteiner",
  "Hanoverian",
  "Oldenburg",
  "KWPN",
  "Zangersheide",
  "Selle Francais",
  "Belgian Warmblood",
  "Westphalian",
  "Irish Sport Horse",
  "Friesian",
  "Trakehner",
  "BWP",
  "Swedish Warmblood",
  "Mecklenburger",
  "Zweibrucker",
  "Lusitano",
  "Irish Draught",
  "Andalusian (PRE)",
] as const;

const curatedOrder = new Map<string, number>(
  CURATED_FEATURED_BREEDS.map((breed, index) => [breed.toLowerCase(), index])
);

export function buildFeaturedBreeds(
  countsByBreed: Record<string, number>,
  limit = 12
): string[] {
  const candidates = CURATED_FEATURED_BREEDS.filter((breed) => Boolean(findBreedByName(breed)));

  const sorted = [...candidates].sort((a, b) => {
    const countA = countsByBreed[a] ?? 0;
    const countB = countsByBreed[b] ?? 0;

    if (countB !== countA) {
      return countB - countA;
    }

    const orderA = curatedOrder.get(a.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    const orderB = curatedOrder.get(b.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  return sorted.slice(0, limit);
}

export function buildBreedListingCounts(
  rows: { breed: string | null }[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const row of rows) {
    const breed = row.breed?.trim();
    if (!breed) continue;
    counts[breed] = (counts[breed] ?? 0) + 1;
  }

  return counts;
}
