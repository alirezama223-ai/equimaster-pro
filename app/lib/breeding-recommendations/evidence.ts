import { BreedingAnalysisReport } from "@/app/types/breeding";
import {
  MIN_SCOREABLE_PAIR_COVERAGE,
  MIN_EVIDENCE_FACTOR,
} from "@/app/lib/breeding-recommendations/constants";

export function computePairCoveragePercent(report: BreedingAnalysisReport): number {
  const mare = report.dataConfidence.mareCompleteness.completenessPercent;
  const stallion = report.dataConfidence.stallionCompleteness.completenessPercent;
  return Math.min(mare, stallion);
}

export function hasKnownNegativePedigreeEvidence(report: BreedingAnalysisReport): boolean {
  if (report.closeRelationshipWarnings.length > 0) return true;

  if (
    report.linebreedingPatterns.some(
      (item) => item.severity === "very_close" || item.severity === "close"
    )
  ) {
    return true;
  }

  const closestDepth = report.structureIndicators.closestCommonAncestorDepth;
  if (
    report.structureIndicators.commonAncestorCount > 0 &&
    closestDepth !== null &&
    closestDepth <= 6
  ) {
    return true;
  }

  return false;
}

export function isPairCoverageInsufficient(pairCoveragePercent: number): boolean {
  return pairCoveragePercent < MIN_SCOREABLE_PAIR_COVERAGE;
}

/**
 * A numeric Compatibility Score is only available when both sides have enough
 * pedigree coverage to assess absence findings, OR when negative evidence is
 * already known from the limited available data.
 */
export function isCompatibilityScoreAvailable(
  pairCoveragePercent: number,
  hasKnownNegativeEvidence: boolean
): boolean {
  if (hasKnownNegativeEvidence) return true;
  return pairCoveragePercent >= MIN_SCOREABLE_PAIR_COVERAGE;
}

/**
 * Scales evidence-dependent dimensions between partial and full coverage.
 * Uses conservative pair coverage (min of both sides).
 */
export function computeEvidenceFactor(pairCoveragePercent: number): number {
  if (pairCoveragePercent >= 100) return 1;
  if (pairCoveragePercent < MIN_SCOREABLE_PAIR_COVERAGE) {
    return MIN_EVIDENCE_FACTOR;
  }

  const range = 100 - MIN_SCOREABLE_PAIR_COVERAGE;
  const normalized = (pairCoveragePercent - MIN_SCOREABLE_PAIR_COVERAGE) / range;
  return MIN_EVIDENCE_FACTOR + normalized * (1 - MIN_EVIDENCE_FACTOR);
}

export function applyEvidenceToAbsenceFinding(
  rawScore: number,
  maxScore: number,
  pairCoveragePercent: number,
  evidenceFactor: number
): number {
  if (rawScore < maxScore) {
    return rawScore;
  }

  if (pairCoveragePercent < MIN_SCOREABLE_PAIR_COVERAGE) {
    return 0;
  }

  return Math.round(rawScore * evidenceFactor);
}
