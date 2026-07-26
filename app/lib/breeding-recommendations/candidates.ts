import { formatStudFee, getStallionCoverUrl, normalizeBreedingMethods } from "@/app/lib/stallions";
import { MAX_RECOMMENDATION_CANDIDATES } from "@/app/lib/breeding-recommendations/constants";
import { normalizeStallionRecommendationFilters } from "@/app/lib/breeding-recommendations/filters";
import {
  StallionRecommendationCandidate,
  StallionRecommendationFilters,
} from "@/app/types/breeding-recommendations";import { StallionRow } from "@/app/types/stallion";
import type { SupabaseClient } from "@supabase/supabase-js";

function matchesBreedingMethods(
  stallionMethods: string[],
  filterMethods: string[] | undefined
): boolean {
  if (!filterMethods || filterMethods.length === 0) return true;
  return filterMethods.some((method) => stallionMethods.includes(method));
}

function matchesStudFee(
  row: Pick<StallionRow, "stud_fee" | "stud_fee_currency">,
  filters: StallionRecommendationFilters
): boolean {
  if (filters.maxStudFee === undefined || filters.maxStudFee === null) return true;
  if (row.stud_fee === null) return false;

  const currency = (row.stud_fee_currency || "EUR").toUpperCase();
  const filterCurrency = filters.studFeeCurrency?.trim().toUpperCase();
  if (filterCurrency && currency !== filterCurrency) return false;

  return row.stud_fee <= filters.maxStudFee;
}

function matchesAvailability(
  availability: StallionRow["availability"],
  includeUnavailable: boolean
): boolean {
  if (includeUnavailable) return true;
  return availability === "available" || availability === "limited";
}

export async function fetchStallionRecommendationCandidates(
  supabase: SupabaseClient,
  marePedigreeId: string,
  filters: StallionRecommendationFilters
): Promise<{ candidates: StallionRecommendationCandidate[]; eligiblePoolCount: number }> {
  const normalizedFilters = normalizeStallionRecommendationFilters(filters);

  let request = supabase    .from("stallions")
    .select(
      "id, name, breed, studbook, birth_year, country, discipline, stud_fee, stud_fee_currency, availability, breeding_methods, cover_image_url, image_urls, verified, pedigree_horse_id, status, created_at"
    )
    .eq("status", "active")
    .not("pedigree_horse_id", "is", null);

  if (normalizedFilters.discipline) {
    request = request.ilike("discipline", normalizedFilters.discipline);
  }
  if (normalizedFilters.country) {
    request = request.ilike("country", normalizedFilters.country);
  }
  if (normalizedFilters.studbook) {
    request = request.ilike("studbook", `%${normalizedFilters.studbook}%`);
  }
  const { data, error } = await request.order("name", { ascending: true }).limit(250);
  if (error || !data) {
    return { candidates: [], eligiblePoolCount: 0 };
  }

  const includeUnavailable = Boolean(normalizedFilters.includeUnavailable);  const seenPedigreeIds = new Set<string>();
  const filtered: StallionRecommendationCandidate[] = [];

  for (const row of data as StallionRow[]) {
    const pedigreeHorseId = row.pedigree_horse_id;
    if (!pedigreeHorseId || pedigreeHorseId === marePedigreeId) continue;
    if (seenPedigreeIds.has(pedigreeHorseId)) continue;
    if (!matchesAvailability(row.availability, includeUnavailable)) continue;

    const breedingMethods = normalizeBreedingMethods(row.breeding_methods);
    if (!matchesBreedingMethods(breedingMethods, normalizedFilters.breedingMethods)) continue;
    if (!matchesStudFee(row, normalizedFilters)) continue;
    seenPedigreeIds.add(pedigreeHorseId);
    filtered.push({
      stallionDirectoryId: row.id,
      pedigreeHorseId,
      name: row.name,
      breed: row.breed,
      studbook: row.studbook,
      birthYear: row.birth_year,
      country: row.country,
      discipline: row.discipline,
      studFee: row.stud_fee,
      studFeeCurrency: row.stud_fee_currency || "EUR",
      studFeeLabel: formatStudFee(row),
      availability: row.availability,
      coverImageUrl: getStallionCoverUrl(row),
      verified: row.verified,
      breedingMethods,
    });
  }

  const eligiblePoolCount = filtered.length;
  const limited = filtered.slice(0, MAX_RECOMMENDATION_CANDIDATES);

  return { candidates: limited, eligiblePoolCount };
}
