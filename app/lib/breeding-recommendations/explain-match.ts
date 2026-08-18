import type { GoalBasedRecommendationResult } from "@/app/lib/breeding-goals/recommendations";

export type MatchExplanation = {
  headline: string;
  positives: string[];
  watchouts: string[];
  confidence: "high" | "moderate" | "limited";
};

/**
 * Deterministic, evidence-grounded explanation for the UI.
 * This intentionally does not invent facts; every statement is derived from
 * the structured recommendation result already produced by Shabdiz.
 */
export function explainMatch(result: GoalBasedRecommendationResult): MatchExplanation {
  const positives: string[] = [];
  const watchouts: string[] = [];

  if (result.goalMatchScore !== null) {
    if (result.goalMatchScore >= 80) positives.push("Strong alignment with the selected breeding goals.");
    else if (result.goalMatchScore >= 60) positives.push("Moderate alignment with the selected breeding goals.");
    else positives.push("The available goal evidence provides limited support for this match.");
  }

  if (result.compatibilityScore !== null) {
    if (result.compatibilityScore >= 80) positives.push("Good pedigree compatibility in the available ancestry data.");
    else if (result.compatibilityScore >= 60) positives.push("Pedigree compatibility is acceptable based on the available ancestry data.");
  }

  if (result.pedigreeRiskLabel === "LOW CONCERN") {
    positives.push("No high-concern close-relationship signal was detected in the analyzed pedigree.");
  } else if (result.pedigreeRiskLabel === "REVIEW") {
    watchouts.push("Pedigree review is recommended before making a breeding decision.");
  } else if (result.pedigreeRiskLabel === "HIGH CONCERN") {
    watchouts.push("A high-concern pedigree signal was detected and should be reviewed professionally before breeding.");
  } else {
    watchouts.push("Pedigree evidence is insufficient for a reliable safety assessment.");
  }

  const strongComplements = result.goalAnalysis?.strongComplements ?? [];
  const potentialConcerns = result.goalAnalysis?.potentialConcerns ?? [];
  const unknowns = result.goalAnalysis?.unknowns ?? [];

  if (strongComplements.length > 0) {
    positives.push(`Strong complements: ${strongComplements.slice(0, 3).join(", ")}.`);
  }
  if (potentialConcerns.length > 0) {
    watchouts.push(`Potential concerns: ${potentialConcerns.slice(0, 3).join(", ")}.`);
  }
  if (unknowns.length > 0) {
    watchouts.push("Some selected traits have limited or unknown evidence.");
  }

  const confidence = result.goalMatchConfidence.includes("HIGH")
    ? "high"
    : result.goalMatchConfidence.includes("MODERATE")
      ? "moderate"
      : "limited";

  const headline = result.finalMatchScore === null
    ? "Insufficient evidence for a reliable combined match score."
    : `This stallion ranks ${result.finalMatchScore}/100 on the current Shabdiz match model.`;

  return {
    headline,
    positives,
    watchouts,
    confidence,
  };
}
