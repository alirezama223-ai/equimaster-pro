import { analyzeBreedingCross } from "@/app/lib/breeding/analyze";
import { loadPedigreeGraph } from "@/app/lib/breeding/ancestor-loader";
import { BREEDING_MAX_GENERATIONS } from "@/app/lib/breeding/constants";
import { calculatePedigreeCompleteness } from "@/app/lib/breeding/completeness";
import { fetchStallionRecommendationCandidates } from "@/app/lib/breeding-recommendations/candidates";
import { RECOMMENDATION_DISCLAIMER } from "@/app/lib/breeding-recommendations/constants";
import {
  buildRecommendationReasons,
  buildRecommendationWarnings,
} from "@/app/lib/breeding-recommendations/explanations";
import {
  isEligibleRecommendationMare,
} from "@/app/lib/breeding-recommendations/mare-search";
import {
  mapAnalysisConfidence,
  passesMinimumConfidenceFilter,
  sortRecommendationResults,
} from "@/app/lib/breeding-recommendations/rank";
import {
  classifyRecommendationRisk,
  riskLevelLabel,
  scorePedigreeCompatibility,
} from "@/app/lib/breeding-recommendations/score";
import { BreedingCandidate } from "@/app/types/breeding";
import {
  RecommendationSortOption,
  StallionRecommendationFilters,
  StallionRecommendationResponse,
  StallionRecommendationResult,
} from "@/app/types/breeding-recommendations";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function runStallionRecommendations(
  supabase: SupabaseClient,
  mare: BreedingCandidate,
  filters: StallionRecommendationFilters,
  sort: RecommendationSortOption = "best_match"
): Promise<{ response: StallionRecommendationResponse | null; error?: string }> {
  if (!isEligibleRecommendationMare(mare)) {
    return {
      response: null,
      error:
        "Selected record is not eligible as a mare for Stallion Match. Choose a pedigree record marked as mare or a marketplace listing identified as Mare.",
    };
  }

  const { candidates, eligiblePoolCount } = await fetchStallionRecommendationCandidates(
    supabase,
    mare.id,
    filters
  );

  if (candidates.length === 0) {
    return {
      response: {
        mare,
        mareCompletenessPercent: 0,
        analyzedCount: 0,
        eligiblePoolCount,
        results: [],
        disclaimer: RECOMMENDATION_DISCLAIMER,
      },
    };
  }

  const stallionPedigreeIds = candidates.map((candidate) => candidate.pedigreeHorseId);
  const graph = await loadPedigreeGraph(
    supabase,
    [mare.id, ...stallionPedigreeIds],
    BREEDING_MAX_GENERATIONS
  );

  const mareCompleteness = calculatePedigreeCompleteness(
    graph,
    mare.id,
    BREEDING_MAX_GENERATIONS
  );

  const results: StallionRecommendationResult[] = [];
  const minimumConfidence = filters.minimumPedigreeConfidence ?? "any";

  for (const candidate of candidates) {
    const { report, error } = await analyzeBreedingCross(
      supabase,
      mare.id,
      candidate.pedigreeHorseId,
      graph
    );

    if (error || !report) continue;

    const scoreBreakdown = scorePedigreeCompatibility(report);
    const riskLevel = classifyRecommendationRisk(report);
    const confidence = mapAnalysisConfidence(report.dataConfidence.level);

    if (!passesMinimumConfidenceFilter(confidence.level, minimumConfidence)) {
      continue;
    }

    const reasons = buildRecommendationReasons(report, scoreBreakdown, riskLevel);
    const warnings = buildRecommendationWarnings(report);
    const scoreLabel = scoreBreakdown.scoreAvailable
      ? String(scoreBreakdown.total ?? "")
      : "Insufficient Data";

    results.push({
      rank: 0,
      candidate,
      compatibilityScore: scoreBreakdown.scoreAvailable ? scoreBreakdown.total : null,
      scoreLabel,
      riskLevel,
      riskLabel: riskLevelLabel(riskLevel),
      analysisConfidence: confidence.level,
      analysisConfidenceLabel: confidence.label,
      scoreBreakdown,
      reasons,
      warnings,
      report,
    });
  }

  const sortedResults = sortRecommendationResults(results, sort, null);

  return {
    response: {
      mare,
      mareCompletenessPercent: mareCompleteness.completenessPercent,
      analyzedCount: sortedResults.length,
      eligiblePoolCount,
      results: sortedResults,
      disclaimer: RECOMMENDATION_DISCLAIMER,
    },
  };
}
