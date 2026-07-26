import {
  MIN_TRAIT_ASSESSABLE_CONFIDENCE,
  SOURCE_TYPE_WEIGHTS,
  STRENGTH_SCORE_THRESHOLD,
  TRAIT_DISCLAIMER,
  TRAIT_DEFINITIONS,
  VERIFIED_ASSESSMENT_MULTIPLIER,
  WEAKNESS_SCORE_THRESHOLD,
  getTraitDefinition,
  isValidTraitKey,
} from "@/app/lib/traits/constants";
import {
  AggregatedTraitValue,
  HorseTraitAssessmentRow,
  HorseTraitProfile,
  TraitAssessmentConfidence,
  TraitKey,
  TraitProfileConfidenceLevel,
  TraitSourceType,
} from "@/app/types/traits";

const CONFIDENCE_INPUT_WEIGHT: Record<TraitAssessmentConfidence, number> = {
  high: 1,
  medium: 0.75,
  low: 0.5,
};

function assessmentWeight(row: HorseTraitAssessmentRow): number {
  const sourceWeight = SOURCE_TYPE_WEIGHTS[row.source_type as TraitSourceType] ?? 0.5;
  const confidenceWeight = CONFIDENCE_INPUT_WEIGHT[row.confidence as TraitAssessmentConfidence] ?? 0.5;
  // Verification boosts weight only; it does not override confidence input or source classification.
  const verifiedBoost = row.verified ? VERIFIED_ASSESSMENT_MULTIPLIER : 1;
  return sourceWeight * confidenceWeight * verifiedBoost;
}

function mapConfidenceScore(score: number): TraitProfileConfidenceLevel {
  if (score >= 0.75) return "high";
  if (score >= 0.5) return "moderate";
  if (score >= MIN_TRAIT_ASSESSABLE_CONFIDENCE) return "limited";
  return "insufficient_data";
}

function aggregateTraitRows(
  traitKey: TraitKey,
  rows: HorseTraitAssessmentRow[]
): AggregatedTraitValue {
  const definition = getTraitDefinition(traitKey);

  if (rows.length === 0) {
    return {
      traitKey,
      label: definition.label,
      category: definition.category,
      categoryLabel: definition.categoryLabel,
      score: null,
      confidence: "insufficient_data",
      evidenceCount: 0,
      verifiedEvidenceCount: 0,
      hasConflict: false,
      explanation: "Insufficient evidence to assess.",
      assessable: false,
    };
  }

  let weightedSum = 0;
  let weightTotal = 0;
  let verifiedCount = 0;
  const weightedScores: number[] = [];

  for (const row of rows) {
    const weight = assessmentWeight(row);
    weightedSum += row.score * weight;
    weightTotal += weight;
    weightedScores.push(row.score);
    if (row.verified) verifiedCount += 1;
  }

  const aggregatedScore = weightTotal > 0 ? weightedSum / weightTotal : null;
  const normalizedConfidence = Math.min(1, weightTotal / 2.5);
  const minScore = Math.min(...weightedScores);
  const maxScore = Math.max(...weightedScores);
  const hasConflict = weightedScores.length > 1 && maxScore - minScore >= 1.5;

  let confidence = mapConfidenceScore(normalizedConfidence);
  if (hasConflict && confidence === "high") confidence = "moderate";
  if (hasConflict && confidence === "moderate") confidence = "limited";

  const assessable =
    aggregatedScore !== null &&
    normalizedConfidence >= MIN_TRAIT_ASSESSABLE_CONFIDENCE &&
    confidence !== "insufficient_data";

  let explanation = `${rows.length} assessment(s)`;
  if (verifiedCount > 0) explanation += `, ${verifiedCount} verified`;
  if (hasConflict) explanation += "; conflicting evidence reduces confidence";

  return {
    traitKey,
    label: definition.label,
    category: definition.category,
    categoryLabel: definition.categoryLabel,
    score: assessable ? Math.round(aggregatedScore! * 10) / 10 : null,
    confidence,
    evidenceCount: rows.length,
    verifiedEvidenceCount: verifiedCount,
    hasConflict,
    explanation: assessable ? explanation : "Insufficient evidence to assess.",
    assessable,
  };
}

export function buildHorseTraitProfile(
  pedigreeHorseId: string,
  rows: HorseTraitAssessmentRow[]
): HorseTraitProfile {
  const byTrait = new Map<TraitKey, HorseTraitAssessmentRow[]>();
  for (const row of rows) {
    if (!isValidTraitKey(row.trait_key)) continue;
    const list = byTrait.get(row.trait_key as TraitKey) ?? [];
    list.push(row);
    byTrait.set(row.trait_key as TraitKey, list);
  }

  const traits = TRAIT_DEFINITIONS.map((definition) =>
    aggregateTraitRows(definition.key, byTrait.get(definition.key) ?? [])
  );

  const assessableTraits = traits.filter((trait) => trait.assessable && trait.score !== null);
  const strengths = assessableTraits.filter((trait) => trait.score! >= STRENGTH_SCORE_THRESHOLD);
  const improvementAreas = assessableTraits.filter(
    (trait) => trait.score! <= WEAKNESS_SCORE_THRESHOLD
  );
  const unknownTraits = traits.filter((trait) => !trait.assessable);

  const confidenceScores: number[] = assessableTraits.map((trait) => {
    if (trait.confidence === "high") return 1;
    if (trait.confidence === "moderate") return 0.7;
    if (trait.confidence === "limited") return 0.45;
    return 0;
  });
  const averageConfidence =
    confidenceScores.length > 0
      ? confidenceScores.reduce((sum, value) => sum + value, 0) / confidenceScores.length
      : 0;

  const overallConfidence =
    assessableTraits.length === 0
      ? "insufficient_data"
      : mapConfidenceScore(averageConfidence);

  return {
    pedigreeHorseId,
    traits,
    strengths,
    improvementAreas,
    unknownTraits,
    overallConfidence,
    disclaimer: TRAIT_DISCLAIMER,
  };
}

export function getAssessableTrait(
  profile: HorseTraitProfile,
  traitKey: TraitKey
): AggregatedTraitValue | null {
  const trait = profile.traits.find((item) => item.traitKey === traitKey);
  if (!trait || !trait.assessable || trait.score === null) return null;
  return trait;
}
