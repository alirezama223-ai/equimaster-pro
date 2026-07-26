import { BreedingAnalysisReport } from "@/app/types/breeding";
import {
  computePairCoveragePercent,
  hasKnownNegativePedigreeEvidence,
  isPairCoverageInsufficient,
} from "@/app/lib/breeding-recommendations/evidence";
import {
  RecommendationRiskLevel,
  RecommendationScoreBreakdown,
} from "@/app/types/breeding-recommendations";

function isLimitedEvidence(report: BreedingAnalysisReport): boolean {
  const pairCoverage = computePairCoveragePercent(report);
  return isPairCoverageInsufficient(pairCoverage) || report.dataConfidence.level === "limited";
}

export function buildRecommendationReasons(
  report: BreedingAnalysisReport,
  breakdown: RecommendationScoreBreakdown,
  riskLevel: RecommendationRiskLevel
): string[] {
  const reasons: string[] = [];
  const limited = isLimitedEvidence(report);
  const insufficient = riskLevel === "insufficient_data" || !breakdown.scoreAvailable;

  if (insufficient) {
    reasons.push(
      "More pedigree information is required before this cross can receive a meaningful compatibility score."
    );
  }

  if (report.closeRelationshipWarnings.length === 0) {
    if (insufficient) {
      reasons.push("Insufficient pedigree data to reliably assess close relationships.");
    } else if (limited) {
      reasons.push("No close relationship detected in the limited available pedigree data.");
    } else {
      reasons.push("✓ No close relationship detected in available pedigree");
    }
  } else {
    reasons.push("⚠ Close pedigree relationship detected in available records");
  }

  if (report.structureIndicators.commonAncestorCount === 0) {
    if (insufficient) {
      reasons.push(
        "No shared ancestors identified in the available data; pedigree coverage is insufficient for a reliable exclusion."
      );
    } else if (limited) {
      reasons.push("No shared ancestors identified in the limited available pedigree data.");
    } else {
      reasons.push("✓ No shared ancestors found within analyzed depth");
    }
  } else if (report.linebreedingPatterns.some((item) => item.severity === "very_close")) {
    reasons.push("⚠ Repeated common ancestor within close generations");
  } else {
    reasons.push(
      `△ ${report.structureIndicators.commonAncestorCount} shared ancestor(s) within analyzed depth`
    );
  }

  const pairCoverage = breakdown.pairCoveragePercent;
  const mare = report.dataConfidence.mareCompleteness.completenessPercent;
  const stallion = report.dataConfidence.stallionCompleteness.completenessPercent;

  if (pairCoverage >= 75) {
    reasons.push("✓ Strong pedigree data coverage on both sides");
  } else if (pairCoverage >= 50) {
    reasons.push("△ Moderate pedigree data coverage; some ancestry gaps remain");
  } else {
    reasons.push(
      `△ Limited pedigree data coverage (pair coverage ${pairCoverage.toFixed(1)}%; mare ${mare.toFixed(1)}%, stallion ${stallion.toFixed(1)}%)`
    );
  }

  if (insufficient) {
    reasons.push("Insufficient ancestry data to assess pedigree diversity reliably.");
  } else if (
    breakdown.pedigreeDiversity !== null &&
    breakdown.pedigreeDiversity >= breakdown.maxPedigreeDiversity * 0.7 &&
    !limited
  ) {
    reasons.push("✓ Available ancestry shows limited duplication/concentration");
  } else if (report.structureIndicators.repeatedBloodlineCount > 0) {
    reasons.push("△ Repeated bloodlines appear on both sides of the cross");
  } else if (limited) {
    reasons.push("Pedigree diversity cannot be assessed reliably from the limited available data.");
  }

  if (
    riskLevel === "low_concern" &&
    breakdown.scoreAvailable &&
    breakdown.closeRelationshipSafety !== null &&
    breakdown.closeRelationshipSafety >= breakdown.maxCloseRelationshipSafety * 0.8 &&
    !limited
  ) {
    reasons.push("✓ No major close-relationship penalties in configured scoring");
  }

  return reasons.slice(0, 5);
}

export function buildRecommendationWarnings(report: BreedingAnalysisReport): string[] {
  const warnings: string[] = [];

  for (const item of report.closeRelationshipWarnings) {
    warnings.push(`⚠ ${item.title}`);
  }

  const closePattern = report.linebreedingPatterns.find(
    (item) => item.severity === "very_close" || item.severity === "close"
  );
  if (closePattern) {
    warnings.push(
      `⚠ Pedigree concentration risk: ${closePattern.name} (${closePattern.notation})`
    );
  }

  return [...new Set(warnings)];
}

export function buildScoreBreakdownNotes(
  report: BreedingAnalysisReport,
  breakdown: RecommendationScoreBreakdown
): string[] {
  const notes: string[] = [];

  if (!breakdown.scoreAvailable) {
    notes.push(
      `Pair coverage is ${breakdown.pairCoveragePercent.toFixed(1)}% (conservative minimum of mare and stallion completeness). Evidence-dependent dimensions are not reliably assessable.`
    );
    notes.push(
      `Data confidence points reflect average pedigree completeness (${report.dataConfidence.mareCompleteness.completenessPercent}% mare, ${report.dataConfidence.stallionCompleteness.completenessPercent}% stallion).`
    );
    return notes;
  }

  if (
    breakdown.rawCloseRelationshipSafety !== undefined &&
    breakdown.rawCloseRelationshipSafety < breakdown.maxCloseRelationshipSafety
  ) {
    notes.push("Close relationship points reflect detected relationships in available pedigree data.");
  } else if (
    breakdown.closeRelationshipSafety !== null &&
    breakdown.closeRelationshipSafety < breakdown.maxCloseRelationshipSafety
  ) {
    notes.push(
      `Close relationship safety adjusted by evidence factor (${breakdown.evidenceFactor?.toFixed(2)}); limited pair coverage (${breakdown.pairCoveragePercent.toFixed(1)}%).`
    );
  } else {
    notes.push("Full close-relationship safety points: no close cross detected with sufficient evidence.");
  }

  if (
    breakdown.rawPedigreeConcentration !== undefined &&
    breakdown.rawPedigreeConcentration < breakdown.maxPedigreeConcentration
  ) {
    notes.push("Pedigree concentration points reduced due to shared ancestors and/or linebreeding patterns.");
  } else if (
    breakdown.pedigreeConcentration !== null &&
    breakdown.pedigreeConcentration < breakdown.maxPedigreeConcentration
  ) {
    notes.push(
      `Pedigree concentration adjusted by evidence factor (${breakdown.evidenceFactor?.toFixed(2)}); absence of shared ancestors is not treated as proof at low coverage.`
    );
  } else {
    notes.push("Full pedigree concentration points: no shared ancestors detected with sufficient evidence.");
  }

  notes.push(
    `Data confidence points reflect average pedigree completeness (${report.dataConfidence.mareCompleteness.completenessPercent}% mare, ${report.dataConfidence.stallionCompleteness.completenessPercent}% stallion).`
  );

  if (
    breakdown.rawPedigreeDiversity !== undefined &&
    breakdown.rawPedigreeDiversity < breakdown.maxPedigreeDiversity
  ) {
    notes.push("Diversity points reduced when repeated or concentrated ancestry appears on both sides.");
  } else if (
    breakdown.pedigreeDiversity !== null &&
    breakdown.pedigreeDiversity < breakdown.maxPedigreeDiversity
  ) {
    notes.push(
      `Pedigree diversity adjusted by evidence factor (${breakdown.evidenceFactor?.toFixed(2)}); limited pair coverage (${breakdown.pairCoveragePercent.toFixed(1)}%).`
    );
  } else {
    notes.push("Full diversity points: limited duplication in available ancestry evidence.");
  }

  if (hasKnownNegativePedigreeEvidence(report)) {
    notes.push("Known negative pedigree findings are preserved and are not suppressed by missing-data uncertainty.");
  }

  return notes;
}
