import { analyzeBreedingGoalsCross } from "@/app/lib/breeding-goals/analyze";
import { analyzeBreedingCross } from "@/app/lib/breeding/analyze";
import { loadPedigreeGraph } from "@/app/lib/breeding/ancestor-loader";
import { BREEDING_MAX_GENERATIONS } from "@/app/lib/breeding/constants";
import { fetchStallionRecommendationCandidates } from "@/app/lib/breeding-recommendations/candidates";
import {
  FINAL_MATCH_GOAL_WEIGHT,
  FINAL_MATCH_PEDIGREE_WEIGHT,
  RECOMMENDATION_DISCLAIMER,
} from "@/app/lib/breeding-recommendations/constants";
import { buildEmptyResultsReason } from "@/app/lib/breeding-recommendations/filters";
import { buildRecommendationWarnings } from "@/app/lib/breeding-recommendations/explanations";
import { isEligibleRecommendationMare } from "@/app/lib/breeding-recommendations/mare-search";
import { mapAnalysisConfidence, passesMinimumConfidenceFilter } from "@/app/lib/breeding-recommendations/rank";
import { classifyRecommendationRisk, riskLevelLabel, scorePedigreeCompatibility } from "@/app/lib/breeding-recommendations/score";
import { buildHorseTraitProfile } from "@/app/lib/traits/aggregate";
import { BreedingCandidate } from "@/app/types/breeding";
import { StallionRecommendationFilters } from "@/app/types/breeding-recommendations";
import { BreedingGoalAnalysisResult, GoalMatchSortOption, HorseTraitAssessmentRow, MareBreedingGoals } from "@/app/types/traits";
import type { SupabaseClient } from "@supabase/supabase-js";

export type GoalBasedRecommendationResult = {
  rank: number;
  stallionDirectoryId: string;
  pedigreeHorseId: string;
  name: string;
  coverImageUrl: string;
  verified: boolean;
  studFeeLabel: string;
  availability: string;
  goalMatchScore: number | null;
  goalMatchConfidence: string;
  goalAnalysis: BreedingGoalAnalysisResult;
  compatibilityScore: number | null;
  finalMatchScore: number | null;
  finalMatchBreakdown: {
    available: boolean;
    pedigreeScore: number | null;
    goalMatchScore: number | null;
    pedigreeWeight: number;
    goalWeight: number;
    finalScore: number | null;
    reason: "both_available" | "pedigree_only" | "insufficient_data";
  };
  pedigreeRiskLabel: string;
  pedigreeWarnings: string[];
  reportAvailable: boolean;
};

export type GoalBasedRecommendationResponse = {
  mare: BreedingCandidate;
  mareTraitProfileSummary: { strengths: string[]; improvementAreas: string[] };
  analyzedCount: number;
  eligiblePoolCount: number;
  emptyResultsReason?: string;
  results: GoalBasedRecommendationResult[];
  disclaimer: string;
};

async function loadTraitRowsForHorses(supabase: SupabaseClient, pedigreeHorseIds: string[]): Promise<Map<string, HorseTraitAssessmentRow[]>> {
  if (pedigreeHorseIds.length === 0) return new Map();
  const { data } = await supabase.from("horse_trait_assessments_public").select("*").in("pedigree_horse_id", pedigreeHorseIds);
  const map = new Map<string, HorseTraitAssessmentRow[]>();
  for (const row of (data ?? []) as HorseTraitAssessmentRow[]) {
    const list = map.get(row.pedigree_horse_id) ?? [];
    list.push(row);
    map.set(row.pedigree_horse_id, list);
  }
  return map;
}

function buildFinalMatch(
  goalMatchScore: number | null,
  compatibilityScore: number | null
): GoalBasedRecommendationResult["finalMatchBreakdown"] {
  if (goalMatchScore !== null && compatibilityScore !== null) {
    return {
      available: true,
      pedigreeScore: compatibilityScore,
      goalMatchScore,
      pedigreeWeight: FINAL_MATCH_PEDIGREE_WEIGHT,
      goalWeight: FINAL_MATCH_GOAL_WEIGHT,
      finalScore: Math.round(
        (goalMatchScore * FINAL_MATCH_GOAL_WEIGHT + compatibilityScore * FINAL_MATCH_PEDIGREE_WEIGHT) / 100
      ),
      reason: "both_available",
    };
  }
  if (goalMatchScore !== null) {
    return {
      available: true,
      pedigreeScore: null,
      goalMatchScore,
      pedigreeWeight: FINAL_MATCH_PEDIGREE_WEIGHT,
      goalWeight: FINAL_MATCH_GOAL_WEIGHT,
      finalScore: goalMatchScore,
      reason: "pedigree_only",
    };
  }
  return {
    available: false,
    pedigreeScore: null,
    goalMatchScore: null,
    pedigreeWeight: FINAL_MATCH_PEDIGREE_WEIGHT,
    goalWeight: FINAL_MATCH_GOAL_WEIGHT,
    finalScore: null,
    reason: "insufficient_data",
  };
}

function sortGoalResults(results: GoalBasedRecommendationResult[], sort: GoalMatchSortOption): GoalBasedRecommendationResult[] {
  const sorted = [...results];
  sorted.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    const scoreA = a.finalMatchScore ?? -1;
    const scoreB = b.finalMatchScore ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    const highRiskA = a.pedigreeRiskLabel === "HIGH CONCERN" ? 1 : 0;
    const highRiskB = b.pedigreeRiskLabel === "HIGH CONCERN" ? 1 : 0;
    if (highRiskA !== highRiskB) return highRiskA - highRiskB;
    return a.name.localeCompare(b.name);
  });
  return sorted.map((item, index) => ({ ...item, rank: index + 1 }));
}

export async function runGoalBasedRecommendations(
  supabase: SupabaseClient,
  mare: BreedingCandidate,
  goals: MareBreedingGoals,
  filters: StallionRecommendationFilters,
  sort: GoalMatchSortOption = "best_goal_match"
): Promise<{ response: GoalBasedRecommendationResponse | null; error?: string }> {
  if (!isEligibleRecommendationMare(mare)) return { response: null, error: "Selected mare is not eligible for Stallion Match." };

  const { candidates, eligiblePoolCount } = await fetchStallionRecommendationCandidates(supabase, mare.id, filters);
  const mareTraitRows = await loadTraitRowsForHorses(supabase, [mare.id]);
  const mareProfile = buildHorseTraitProfile(mare.id, mareTraitRows.get(mare.id) ?? []);

  if (candidates.length === 0) {
    return {
      response: {
        mare,
        mareTraitProfileSummary: {
          strengths: mareProfile.strengths.map((item) => item.label),
          improvementAreas: mareProfile.improvementAreas.map((item) => item.label),
        },
        analyzedCount: 0,
        eligiblePoolCount,
        emptyResultsReason: buildEmptyResultsReason(filters),
        results: [],
        disclaimer: RECOMMENDATION_DISCLAIMER,
      },
    };
  }

  const stallionIds = candidates.map((item) => item.pedigreeHorseId);
  const traitMap = await loadTraitRowsForHorses(supabase, stallionIds);
  const graph = await loadPedigreeGraph(supabase, [mare.id, ...stallionIds], BREEDING_MAX_GENERATIONS);
  const minimumConfidence = filters.minimumPedigreeConfidence ?? "any";
  const results: GoalBasedRecommendationResult[] = [];

  for (const candidate of candidates) {
    const stallionProfile = buildHorseTraitProfile(candidate.pedigreeHorseId, traitMap.get(candidate.pedigreeHorseId) ?? []);
    const goalAnalysis = analyzeBreedingGoalsCross(mareProfile, stallionProfile, goals);
    const { report } = await analyzeBreedingCross(supabase, mare.id, candidate.pedigreeHorseId, graph);

    let compatibilityScore: number | null = null;
    let pedigreeRiskLabel = "INSUFFICIENT DATA";
    let pedigreeWarnings: string[] = [];

    if (report) {
      const scoreBreakdown = scorePedigreeCompatibility(report);
      const riskLevel = classifyRecommendationRisk(report);
      const confidence = mapAnalysisConfidence(report.dataConfidence.level);
      pedigreeRiskLabel = riskLevelLabel(riskLevel);
      pedigreeWarnings = buildRecommendationWarnings(report);
      if (passesMinimumConfidenceFilter(confidence.level, minimumConfidence)) {
        compatibilityScore = scoreBreakdown.scoreAvailable ? scoreBreakdown.total : null;
      }
    }

    const finalMatchBreakdown = buildFinalMatch(goalAnalysis.goalMatchScore, compatibilityScore);

    results.push({
      rank: 0,
      stallionDirectoryId: candidate.stallionDirectoryId,
      pedigreeHorseId: candidate.pedigreeHorseId,
      name: candidate.name,
      coverImageUrl: candidate.coverImageUrl,
      verified: candidate.verified,
      studFeeLabel: candidate.studFeeLabel,
      availability: candidate.availability,
      goalMatchScore: goalAnalysis.goalMatchScore,
      goalMatchConfidence: goalAnalysis.goalMatchConfidence.toUpperCase(),
      goalAnalysis,
      compatibilityScore,
      finalMatchScore: finalMatchBreakdown.finalScore,
      finalMatchBreakdown,
      pedigreeRiskLabel,
      pedigreeWarnings,
      reportAvailable: Boolean(report),
    });
  }

  return {
    response: {
      mare,
      mareTraitProfileSummary: {
        strengths: mareProfile.strengths.map((item) => item.label),
        improvementAreas: mareProfile.improvementAreas.map((item) => item.label),
      },
      analyzedCount: results.length,
      eligiblePoolCount,
      results: sortGoalResults(results, sort),
      disclaimer: RECOMMENDATION_DISCLAIMER,
    },
  };
}
