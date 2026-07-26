import { CONFIDENCE_ORDER, RISK_ORDER } from "@/app/lib/breeding-recommendations/constants";
import {
  RecommendationConfidenceLevel,
  RecommendationSortOption,
  StallionRecommendationResult,
} from "@/app/types/breeding-recommendations";

function confidenceLevelFromReport(level: string): RecommendationConfidenceLevel {
  if (level === "high") return "high";
  if (level === "moderate") return "moderate";
  return "limited";
}

export function mapAnalysisConfidence(
  level: string
): { level: RecommendationConfidenceLevel; label: string } {
  const mapped = confidenceLevelFromReport(level);
  return {
    level: mapped,
    label: mapped === "high" ? "HIGH" : mapped === "moderate" ? "MODERATE" : "LIMITED",
  };
}

function combinedCompleteness(result: StallionRecommendationResult): number {
  return (
    result.report.dataConfidence.stallionCompleteness.completenessPercent +
    result.report.dataConfidence.mareCompleteness.completenessPercent
  );
}

function compareScoreableResults(
  a: StallionRecommendationResult,
  b: StallionRecommendationResult
): number {
  const scoreA = a.compatibilityScore ?? 0;
  const scoreB = b.compatibilityScore ?? 0;
  if (scoreB !== scoreA) return scoreB - scoreA;

  if (CONFIDENCE_ORDER[a.analysisConfidence] !== CONFIDENCE_ORDER[b.analysisConfidence]) {
    return CONFIDENCE_ORDER[a.analysisConfidence] - CONFIDENCE_ORDER[b.analysisConfidence];
  }

  if (RISK_ORDER[a.riskLevel] !== RISK_ORDER[b.riskLevel]) {
    return RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
  }

  const completenessDiff = combinedCompleteness(b) - combinedCompleteness(a);
  if (completenessDiff !== 0) return completenessDiff;

  return a.candidate.name.localeCompare(b.candidate.name);
}

function compareInsufficientResults(
  a: StallionRecommendationResult,
  b: StallionRecommendationResult
): number {
  const coverageDiff = b.scoreBreakdown.pairCoveragePercent - a.scoreBreakdown.pairCoveragePercent;
  if (coverageDiff !== 0) return coverageDiff;

  const completenessDiff = combinedCompleteness(b) - combinedCompleteness(a);
  if (completenessDiff !== 0) return completenessDiff;

  return a.candidate.name.localeCompare(b.candidate.name);
}

function compareByBestMatch(a: StallionRecommendationResult, b: StallionRecommendationResult): number {
  if (a.scoreBreakdown.scoreAvailable !== b.scoreBreakdown.scoreAvailable) {
    return a.scoreBreakdown.scoreAvailable ? -1 : 1;
  }

  if (a.scoreBreakdown.scoreAvailable) {
    return compareScoreableResults(a, b);
  }

  return compareInsufficientResults(a, b);
}

export function sortRecommendationResults(
  results: StallionRecommendationResult[],
  sort: RecommendationSortOption,
  singleCurrencyPool: string | null
): StallionRecommendationResult[] {
  const sorted = [...results];

  switch (sort) {
    case "highest_confidence":
      sorted.sort((a, b) => {
        const confidenceDiff =
          CONFIDENCE_ORDER[a.analysisConfidence] - CONFIDENCE_ORDER[b.analysisConfidence];
        if (confidenceDiff !== 0) return confidenceDiff;
        return compareByBestMatch(a, b);
      });
      break;
    case "lowest_stud_fee":
      sorted.sort((a, b) => {
        if (a.scoreBreakdown.scoreAvailable !== b.scoreBreakdown.scoreAvailable) {
          return a.scoreBreakdown.scoreAvailable ? -1 : 1;
        }
        if (singleCurrencyPool) {
          const feeA = a.candidate.studFee ?? Number.MAX_SAFE_INTEGER;
          const feeB = b.candidate.studFee ?? Number.MAX_SAFE_INTEGER;
          if (feeA !== feeB) return feeA - feeB;
        }
        return compareByBestMatch(a, b);
      });
      break;
    case "name":
      sorted.sort((a, b) => a.candidate.name.localeCompare(b.candidate.name));
      break;
    default:
      sorted.sort(compareByBestMatch);
  }

  return sorted.map((item, index) => ({ ...item, rank: index + 1 }));
}

export function detectSingleStudFeeCurrency(
  results: StallionRecommendationResult[]
): string | null {
  const currencies = new Set(
    results
      .map((item) => item.candidate.studFeeCurrency?.trim().toUpperCase())
      .filter(Boolean) as string[]
  );
  return currencies.size === 1 ? [...currencies][0] : null;
}

export function passesMinimumConfidenceFilter(
  confidence: RecommendationConfidenceLevel,
  minimum: "any" | "moderate" | "high"
): boolean {
  if (minimum === "any") return true;
  if (minimum === "high") return confidence === "high";
  return confidence === "high" || confidence === "moderate";
}
