import {
  CLOSE_RELATIONSHIP_WEIGHT,
  COMMON_ANCESTOR_WEIGHT,
  DATA_CONFIDENCE_WEIGHT,
  PEDIGREE_DIVERSITY_WEIGHT,
} from "@/app/lib/breeding-recommendations/constants";
import {
  applyEvidenceToAbsenceFinding,
  computeEvidenceFactor,
  computePairCoveragePercent,
  hasKnownNegativePedigreeEvidence,
  isCompatibilityScoreAvailable,
  isPairCoverageInsufficient,
} from "@/app/lib/breeding-recommendations/evidence";
import { BreedingAnalysisReport } from "@/app/types/breeding";
import {
  RecommendationRiskLevel,
  RecommendationScoreBreakdown,
} from "@/app/types/breeding-recommendations";

function scoreRawCloseRelationshipSafety(report: BreedingAnalysisReport): number {
  const warnings = report.closeRelationshipWarnings;
  if (warnings.length === 0) return CLOSE_RELATIONSHIP_WEIGHT;

  const hasCritical = warnings.some((item) => item.severity === "critical");
  const hasSameHorse = warnings.some((item) => item.kind === "same_horse");
  const hasParentOffspring = warnings.some((item) => item.kind === "parent_offspring");
  const hasFullSibling = warnings.some((item) => item.kind === "full_sibling");

  if (hasSameHorse || hasParentOffspring || hasFullSibling) return 5;
  if (hasCritical) return 10;
  if (warnings.some((item) => item.kind === "half_sibling")) return 18;
  if (warnings.some((item) => item.kind === "grandparent_grandoffspring")) return 22;
  return 15;
}

function scoreRawPedigreeConcentration(report: BreedingAnalysisReport): number {
  let score = COMMON_ANCESTOR_WEIGHT;
  const { commonAncestorCount, closestCommonAncestorDepth, linebreedingPatternCount } =
    report.structureIndicators;

  if (commonAncestorCount === 0 && linebreedingPatternCount === 0) {
    return score;
  }

  if (closestCommonAncestorDepth !== null) {
    if (closestCommonAncestorDepth <= 4) score -= 15;
    else if (closestCommonAncestorDepth <= 6) score -= 10;
    else if (closestCommonAncestorDepth <= 8) score -= 5;
  }

  score -= Math.min(10, commonAncestorCount * 2);

  const veryClosePatterns = report.linebreedingPatterns.filter(
    (item) => item.severity === "very_close"
  ).length;
  const closePatterns = report.linebreedingPatterns.filter((item) => item.severity === "close").length;
  score -= veryClosePatterns * 8;
  score -= closePatterns * 4;

  return Math.max(0, Math.round(score));
}

function scoreDataConfidence(report: BreedingAnalysisReport): number {
  const mare = report.dataConfidence.mareCompleteness.completenessPercent;
  const stallion = report.dataConfidence.stallionCompleteness.completenessPercent;
  const average = (mare + stallion) / 2;
  return Math.round((average / 100) * DATA_CONFIDENCE_WEIGHT);
}

function scoreRawPedigreeDiversity(report: BreedingAnalysisReport): number {
  let score = PEDIGREE_DIVERSITY_WEIGHT;
  const repeated = report.structureIndicators.repeatedBloodlineCount;
  const commonCount = report.structureIndicators.commonAncestorCount;

  score -= Math.min(8, repeated * 3);
  score -= Math.min(8, Math.max(0, commonCount - 1) * 2);

  const closePatterns = report.linebreedingPatterns.filter(
    (item) => item.severity === "very_close" || item.severity === "close"
  ).length;
  score -= Math.min(6, closePatterns * 2);

  return Math.max(0, Math.round(score));
}

function classifyKnownRisk(report: BreedingAnalysisReport): RecommendationRiskLevel {
  const warnings = report.closeRelationshipWarnings;
  const hasCritical = warnings.some((item) => item.severity === "critical");
  const hasVeryCloseLinebreeding = report.linebreedingPatterns.some(
    (item) => item.severity === "very_close"
  );

  if (hasCritical || hasVeryCloseLinebreeding) {
    return "high_concern";
  }

  const hasHighWarning = warnings.some((item) => item.severity === "high");
  const hasCloseLinebreeding = report.linebreedingPatterns.some((item) => item.severity === "close");
  const manyCommonAncestors = report.structureIndicators.commonAncestorCount >= 3;
  const closeDepth =
    report.structureIndicators.closestCommonAncestorDepth !== null &&
    report.structureIndicators.closestCommonAncestorDepth <= 6;

  if (hasHighWarning || hasCloseLinebreeding || (manyCommonAncestors && closeDepth)) {
    return "review";
  }

  return "low_concern";
}

export function classifyRecommendationRisk(report: BreedingAnalysisReport): RecommendationRiskLevel {
  const pairCoverage = computePairCoveragePercent(report);
  const knownNegativeEvidence = hasKnownNegativePedigreeEvidence(report);

  if (knownNegativeEvidence) {
    return classifyKnownRisk(report);
  }

  if (isPairCoverageInsufficient(pairCoverage)) {
    return "insufficient_data";
  }

  return "low_concern";
}

export function riskLevelLabel(level: RecommendationRiskLevel): string {
  switch (level) {
    case "high_concern":
      return "HIGH CONCERN";
    case "review":
      return "REVIEW";
    case "insufficient_data":
      return "INSUFFICIENT DATA";
    default:
      return "LOW CONCERN";
  }
}

export function scorePedigreeCompatibility(
  report: BreedingAnalysisReport
): RecommendationScoreBreakdown {
  const pairCoveragePercent = computePairCoveragePercent(report);
  const knownNegativeEvidence = hasKnownNegativePedigreeEvidence(report);
  const scoreAvailable = isCompatibilityScoreAvailable(
    pairCoveragePercent,
    knownNegativeEvidence
  );
  const evidenceFactor = scoreAvailable ? computeEvidenceFactor(pairCoveragePercent) : null;

  const rawCloseRelationshipSafety = scoreRawCloseRelationshipSafety(report);
  const rawPedigreeConcentration = scoreRawPedigreeConcentration(report);
  const rawPedigreeDiversity = scoreRawPedigreeDiversity(report);
  const dataConfidence = scoreDataConfidence(report);

  if (!scoreAvailable) {
    return {
      scoreAvailable: false,
      pairCoveragePercent,
      evidenceFactor: null,
      rawCloseRelationshipSafety,
      rawPedigreeConcentration,
      rawPedigreeDiversity,
      closeRelationshipSafety: null,
      pedigreeConcentration: null,
      dataConfidence,
      pedigreeDiversity: null,
      total: null,
      maxCloseRelationshipSafety: CLOSE_RELATIONSHIP_WEIGHT,
      maxPedigreeConcentration: COMMON_ANCESTOR_WEIGHT,
      maxDataConfidence: DATA_CONFIDENCE_WEIGHT,
      maxPedigreeDiversity: PEDIGREE_DIVERSITY_WEIGHT,
    };
  }

  const factor = evidenceFactor ?? 1;
  const closeRelationshipSafety = applyEvidenceToAbsenceFinding(
    rawCloseRelationshipSafety,
    CLOSE_RELATIONSHIP_WEIGHT,
    pairCoveragePercent,
    factor
  );
  const pedigreeConcentration = applyEvidenceToAbsenceFinding(
    rawPedigreeConcentration,
    COMMON_ANCESTOR_WEIGHT,
    pairCoveragePercent,
    factor
  );
  const pedigreeDiversity = applyEvidenceToAbsenceFinding(
    rawPedigreeDiversity,
    PEDIGREE_DIVERSITY_WEIGHT,
    pairCoveragePercent,
    factor
  );
  const total =
    closeRelationshipSafety + pedigreeConcentration + dataConfidence + pedigreeDiversity;

  return {
    scoreAvailable: true,
    pairCoveragePercent,
    evidenceFactor: factor,
    rawCloseRelationshipSafety,
    rawPedigreeConcentration,
    rawPedigreeDiversity,
    closeRelationshipSafety,
    pedigreeConcentration,
    dataConfidence,
    pedigreeDiversity,
    total,
    maxCloseRelationshipSafety: CLOSE_RELATIONSHIP_WEIGHT,
    maxPedigreeConcentration: COMMON_ANCESTOR_WEIGHT,
    maxDataConfidence: DATA_CONFIDENCE_WEIGHT,
    maxPedigreeDiversity: PEDIGREE_DIVERSITY_WEIGHT,
  };
}
