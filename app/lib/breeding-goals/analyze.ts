import {
  GOAL_PRIORITY_WEIGHT,
  MIN_GOAL_COVERAGE_RATIO,
  TRAIT_DISCLAIMER,
  getTraitDefinition,
} from "@/app/lib/traits/constants";
import { getAssessableTrait } from "@/app/lib/traits/aggregate";
import {
  BreedingGoalAnalysisResult,
  BreedingGoalEntry,
  ComplementStatus,
  GoalTraitAnalysis,
  MareBreedingGoals,
  TraitKey,
  TraitProfileConfidenceLevel,
} from "@/app/types/traits";
import { HorseTraitProfile } from "@/app/types/traits";

function priorityWeight(priority: BreedingGoalEntry["priority"]): number {
  return GOAL_PRIORITY_WEIGHT[priority];
}

function statusLabel(status: ComplementStatus): string {
  switch (status) {
    case "strong_complement":
      return "Strong Complement";
    case "complement":
      return "Complement";
    case "potential_concern":
      return "Potential Concern";
    case "insufficient_data":
      return "Insufficient Data";
    default:
      return "Neutral / Uncertain";
  }
}

function analyzeImproveGoal(
  goal: BreedingGoalEntry,
  mareTrait: ReturnType<typeof getAssessableTrait>,
  stallionTrait: ReturnType<typeof getAssessableTrait>,
  avoidReinforcing: boolean
): GoalTraitAnalysis {
  const definition = getTraitDefinition(goal.traitKey);

  if (!mareTrait || !stallionTrait) {
    return {
      traitKey: goal.traitKey,
      label: definition.label,
      goalType: "improve",
      priority: goal.priority,
      mareScore: mareTrait?.score ?? null,
      mareConfidence: mareTrait?.confidence ?? "insufficient_data",
      stallionScore: stallionTrait?.score ?? null,
      stallionConfidence: stallionTrait?.confidence ?? "insufficient_data",
      status: "insufficient_data",
      statusLabel: statusLabel("insufficient_data"),
      explanation: "Insufficient trait evidence on one or both horses to assess this improvement goal.",
      reinforcedWeakness: false,
    };
  }

  const gap = stallionTrait.score! - mareTrait.score!;
  let status: ComplementStatus = "neutral";
  let explanation = "Available evidence does not show a clear complement for this goal.";

  const reinforcedWeakness =
    avoidReinforcing && mareTrait.score! <= 2.5 && stallionTrait.score! <= 2.5;

  if (reinforcedWeakness) {
    status = "potential_concern";
    explanation =
      "Available evidence suggests both horses are weaker in this trait. This cross may not strongly address the selected improvement goal.";
  } else if (gap >= 1.25) {
    status = "strong_complement";
    explanation = `The stallion has stronger available ${definition.label.toLowerCase()} evidence than the mare, with ${stallionTrait.confidence.replace("_", " ")} confidence on the stallion side.`;
  } else if (gap >= 0.5) {
    status = "complement";
    explanation = `The stallion may complement the mare for ${definition.label.toLowerCase()} based on available structured evidence.`;
  } else if (gap <= -0.5) {
    status = "potential_concern";
    explanation = `Available evidence suggests the stallion is not clearly stronger than the mare for ${definition.label.toLowerCase()}.`;
  }

  return {
    traitKey: goal.traitKey,
    label: definition.label,
    goalType: "improve",
    priority: goal.priority,
    mareScore: mareTrait.score,
    mareConfidence: mareTrait.confidence,
    stallionScore: stallionTrait.score,
    stallionConfidence: stallionTrait.confidence,
    status,
    statusLabel: statusLabel(status),
    explanation,
    reinforcedWeakness,
  };
}

function analyzePreserveGoal(
  traitKey: TraitKey,
  mareTrait: ReturnType<typeof getAssessableTrait>,
  stallionTrait: ReturnType<typeof getAssessableTrait>
): GoalTraitAnalysis {
  const definition = getTraitDefinition(traitKey);

  if (!mareTrait || !stallionTrait) {
    return {
      traitKey,
      label: definition.label,
      goalType: "preserve",
      priority: "medium",
      mareScore: mareTrait?.score ?? null,
      mareConfidence: mareTrait?.confidence ?? "insufficient_data",
      stallionScore: stallionTrait?.score ?? null,
      stallionConfidence: stallionTrait?.confidence ?? "insufficient_data",
      status: "insufficient_data",
      statusLabel: statusLabel("insufficient_data"),
      explanation: "Insufficient evidence to assess preserve-strength alignment.",
      reinforcedWeakness: false,
    };
  }

  const minScore = Math.min(mareTrait.score!, stallionTrait.score!);
  let status: ComplementStatus = "neutral";
  let explanation = "Preserve-strength alignment is uncertain from available evidence.";

  if (minScore >= 4) {
    status = "strong_complement";
    explanation = `Both horses show strong available evidence for ${definition.label.toLowerCase()}, supporting a preserve-strength goal.`;
  } else if (minScore >= 3.25) {
    status = "complement";
    explanation = `Available evidence suggests reasonable alignment to preserve ${definition.label.toLowerCase()}.`;
  } else if (minScore <= 2.5) {
    status = "potential_concern";
    explanation = `Available evidence does not strongly support preserving ${definition.label.toLowerCase()} in this cross.`;
  }

  return {
    traitKey,
    label: definition.label,
    goalType: "preserve",
    priority: "medium",
    mareScore: mareTrait.score,
    mareConfidence: mareTrait.confidence,
    stallionScore: stallionTrait.score,
    stallionConfidence: stallionTrait.confidence,
    status,
    statusLabel: statusLabel(status),
    explanation,
    reinforcedWeakness: false,
  };
}

function clampStatusPoints(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

/**
 * Convert the actual evidence relationship into 0–100 status points.
 *
 * Improve goals are driven by the stallion-vs-mare evidence gap rather than
 * by a fixed point value for the qualitative status label. A 1.0-point gap
 * maps to 80 points, while larger/smaller gaps move the score continuously.
 *
 * Preserve goals use the weaker of the two horses because a preserve goal is
 * only as strong as the side with the lower evidence score.
 */
function statusPoints(analysis: GoalTraitAnalysis): number {
  if (analysis.mareScore == null || analysis.stallionScore == null) return 0;

  if (analysis.goalType === "improve") {
    const gap = analysis.stallionScore - analysis.mareScore;
    return clampStatusPoints(50 + gap * 30);
  }

  const weakerScore = Math.min(analysis.mareScore, analysis.stallionScore);
  return clampStatusPoints(weakerScore * 20);
}

function confidenceMultiplier(level: TraitProfileConfidenceLevel): number {
  switch (level) {
    case "high":
      return 1;
    case "moderate":
      return 0.85;
    case "limited":
      return 0.65;
    default:
      return 0;
  }
}

/**
 * Breeding Goal Match Score (0–100), separate from Phase 10 pedigree compatibility.
 *
 * For each selected goal with assessable evidence on BOTH horses:
 *   contribution = evidenceDrivenStatusPoints × priorityWeight × avgConfidenceMultiplier
 *
 * goalMatchScore = sum(contributions) / sum(maxPossibleContributions) × 100
 *
 * Returns null when selected goal coverage on both horses is below MIN_GOAL_COVERAGE_RATIO.
 */
export function analyzeBreedingGoalsCross(
  mareProfile: HorseTraitProfile,
  stallionProfile: HorseTraitProfile,
  goals: MareBreedingGoals
): BreedingGoalAnalysisResult {
  const traitAnalyses: GoalTraitAnalysis[] = [];

  for (const goal of goals.improveGoals) {
    traitAnalyses.push(
      analyzeImproveGoal(
        goal,
        getAssessableTrait(mareProfile, goal.traitKey),
        getAssessableTrait(stallionProfile, goal.traitKey),
        goals.avoidReinforcingWeaknesses
      )
    );
  }

  for (const traitKey of goals.preserveTraits) {
    traitAnalyses.push(
      analyzePreserveGoal(
        traitKey,
        getAssessableTrait(mareProfile, traitKey),
        getAssessableTrait(stallionProfile, traitKey)
      )
    );
  }

  const selectedGoalCount = traitAnalyses.length;
  const assessableAnalyses = traitAnalyses.filter((item) => item.status !== "insufficient_data");
  const goalCoveragePercent =
    selectedGoalCount === 0 ? 0 : (assessableAnalyses.length / selectedGoalCount) * 100;

  let weightedTotal = 0;
  let weightedMax = 0;

  for (const analysis of assessableAnalyses) {
    const priority = priorityWeight(analysis.priority);
    const avgConfidence =
      confidenceMultiplier(analysis.mareConfidence) * 0.5 +
      confidenceMultiplier(analysis.stallionConfidence) * 0.5;
    const points = statusPoints(analysis);
    const weightedContribution = points * avgConfidence * priority;
    const maxContribution = 100 * priority;

    analysis.priorityWeight = priority;
    analysis.statusPoints = points;
    analysis.avgConfidenceMultiplier = Math.round(avgConfidence * 100) / 100;
    analysis.weightedContribution = Math.round(weightedContribution * 100) / 100;
    analysis.maxContribution = maxContribution;

    weightedTotal += weightedContribution;
    weightedMax += maxContribution;
  }

  const goalMatchScoreAvailable =
    selectedGoalCount > 0 && goalCoveragePercent / 100 >= MIN_GOAL_COVERAGE_RATIO && weightedMax > 0;

  const goalMatchScore = goalMatchScoreAvailable
    ? Math.round((weightedTotal / weightedMax) * 100)
    : null;

  const confidenceLevels = assessableAnalyses.flatMap((item) => [item.mareConfidence, item.stallionConfidence]);
  const avgConfidenceScore =
    confidenceLevels.length === 0
      ? 0
      : confidenceLevels.reduce((sum, level) => sum + confidenceMultiplier(level), 0) /
        confidenceLevels.length;

  let goalMatchConfidence: TraitProfileConfidenceLevel = "insufficient_data";
  if (goalMatchScoreAvailable) {
    if (avgConfidenceScore >= 0.85) goalMatchConfidence = "high";
    else if (avgConfidenceScore >= 0.65) goalMatchConfidence = "moderate";
    else goalMatchConfidence = "limited";
  }

  return {
    marePedigreeId: goals.marePedigreeId,
    stallionPedigreeId: stallionProfile.pedigreeHorseId,
    goalMatchScore,
    goalMatchScoreAvailable,
    goalMatchConfidence,
    goalCoveragePercent: Math.round(goalCoveragePercent * 10) / 10,
    traitAnalyses,
    strongComplements: traitAnalyses
      .filter((item) => item.status === "strong_complement")
      .map((item) => item.label),
    strengthsPreserved: traitAnalyses
      .filter((item) => item.goalType === "preserve" && (item.status === "strong_complement" || item.status === "complement"))
      .map((item) => item.label),
    potentialConcerns: traitAnalyses
      .filter((item) => item.status === "potential_concern")
      .map((item) => item.label),
    unknowns: traitAnalyses
      .filter((item) => item.status === "insufficient_data")
      .map((item) => item.label),
    reinforcedWeaknesses: traitAnalyses
      .filter((item) => item.reinforcedWeakness)
      .map((item) => item.label),
    mareSummary: {
      strengths: mareProfile.strengths.map((item) => item.label),
      improvementAreas: mareProfile.improvementAreas.map((item) => item.label),
      unknowns: mareProfile.unknownTraits.slice(0, 8).map((item) => item.label),
    },
    disclaimer: TRAIT_DISCLAIMER,
  };
}
