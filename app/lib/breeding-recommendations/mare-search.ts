import type { SupabaseClient } from "@supabase/supabase-js";
import {
  enrichCandidatesWithPedigreeMetadata,
  searchListingBreedingCandidates,
} from "@/app/lib/breeding/candidate-search";
import { BreedingCandidate } from "@/app/types/breeding";

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_,]/g, "");
}

async function searchStrictMarePedigreeCandidates(
  supabase: SupabaseClient,
  query: string
): Promise<BreedingCandidate[]> {
  const safeQuery = escapeIlikePattern(query);
  const normalizedPattern = safeQuery.replace(/\s+/g, "%");

  const { data, error } = await supabase
    .from("pedigree_horses")
    .select("id, name, sex, birth_year, studbook, registration_number, verified, sire_id, dam_id")
    .eq("sex", "mare")
    .or(
      `name.ilike.%${safeQuery}%,normalized_name.ilike.%${normalizedPattern}%,registration_number.ilike.%${safeQuery}%,studbook.ilike.%${safeQuery}%`
    )
    .order("name", { ascending: true })
    .limit(25);

  if (error || !data) return [];

  const candidates: BreedingCandidate[] = data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    sex: "mare" as const,
    birthYear: (row.birth_year as number | null) ?? null,
    studbook: (row.studbook as string | null) ?? null,
    registrationNumber: (row.registration_number as string | null) ?? null,
    sireName: null,
    damSireName: null,
    verified: Boolean(row.verified),
    source: "pedigree" as const,
    sourceId: null,
  }));

  return enrichCandidatesWithPedigreeMetadata(supabase, candidates);
}

export async function searchRecommendationMares(
  supabase: SupabaseClient,
  query: string,
  userId: string | null
): Promise<{ candidates: BreedingCandidate[]; error?: string }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { candidates: [] };
  }

  const strictMares = await searchStrictMarePedigreeCandidates(supabase, trimmed);
  const existingIds = new Set(strictMares.map((candidate) => candidate.id));

  const listingMares = await searchListingBreedingCandidates(
    supabase,
    trimmed,
    "mare",
    userId,
    existingIds
  );

  const candidates = [...strictMares, ...listingMares]
    .filter((candidate) => candidate.sex === "mare" || candidate.source === "listing")
    .sort((a, b) => a.name.localeCompare(b.name));

  return { candidates: candidates.slice(0, 25) };
}

export function isEligibleRecommendationMare(candidate: BreedingCandidate): boolean {
  if (candidate.sex === "mare") return true;
  return candidate.source === "listing";
}
