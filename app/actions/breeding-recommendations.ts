"use server";

import { getBreedingCandidateById } from "@/app/actions/breeding";
import { runStallionRecommendations } from "@/app/lib/breeding-recommendations/engine";
import {
  isEligibleRecommendationMare,
  searchRecommendationMares,
} from "@/app/lib/breeding-recommendations/mare-search";
import { createClient } from "@/app/lib/supabase/server";
import { BreedingCandidate } from "@/app/types/breeding";
import {
  RecommendationSortOption,
  StallionRecommendationFilters,
  StallionRecommendationResponse,
} from "@/app/types/breeding-recommendations";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export async function searchRecommendationMareCandidates(input: { query?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return searchRecommendationMares(supabase, input.query?.trim() ?? "", user?.id ?? null);
}

export async function getRecommendationMareById(pedigreeId: string) {
  if (!isUuid(pedigreeId)) {
    return { candidate: null, error: "Invalid pedigree ID." };
  }

  const result = await getBreedingCandidateById(pedigreeId);
  if (!result.candidate) {
    return result;
  }

  if (!isEligibleRecommendationMare(result.candidate)) {
    return {
      candidate: null,
      error:
        "This pedigree record is not eligible as a mare for Stallion Match. Select a record marked as mare or a Mare marketplace listing.",
    };
  }

  return result;
}

export async function runStallionRecommendationSearch(input: {
  marePedigreeId: string;
  filters?: StallionRecommendationFilters;
  sort?: RecommendationSortOption;
}): Promise<{ response: StallionRecommendationResponse | null; error?: string }> {
  if (!isUuid(input.marePedigreeId)) {
    return { response: null, error: "Invalid mare pedigree ID." };
  }

  const mareResult = await getRecommendationMareById(input.marePedigreeId);
  if (!mareResult.candidate) {
    return { response: null, error: mareResult.error ?? "Mare record not found." };
  }

  const supabase = await createClient();
  const { data: readable } = await supabase
    .from("pedigree_horses")
    .select("id")
    .eq("id", input.marePedigreeId)
    .maybeSingle();

  if (!readable?.id) {
    return { response: null, error: "You are not authorized to access this mare pedigree record." };
  }

  return runStallionRecommendations(
    supabase,
    mareResult.candidate as BreedingCandidate,
    input.filters ?? {},
    input.sort ?? "best_match"
  );
}
