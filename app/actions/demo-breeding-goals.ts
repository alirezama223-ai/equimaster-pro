"use server";

import { getBreedingCandidateById } from "@/app/actions/breeding";
import { getHorseTraitProfile, getMareBreedingGoals } from "@/app/actions/traits";
import { analyzeBreedingGoalsCross } from "@/app/lib/breeding-goals/analyze";
import type { BreedingGoalAnalysisResult, HorseTraitProfile, MareBreedingGoals } from "@/app/types/traits";

export async function analyzeBreedingGoalCrossWithDemo(input: {
  marePedigreeId: string;
  stallionPedigreeId: string;
  goals?: MareBreedingGoals;
}): Promise<{
  analysis: BreedingGoalAnalysisResult | null;
  mareProfile: HorseTraitProfile | null;
  stallionProfile: HorseTraitProfile | null;
  error?: string;
}> {
  const [mareCandidate, stallionCandidate, mareTraits, stallionTraits] = await Promise.all([
    getBreedingCandidateById(input.marePedigreeId),
    getBreedingCandidateById(input.stallionPedigreeId),
    getHorseTraitProfile(input.marePedigreeId),
    getHorseTraitProfile(input.stallionPedigreeId),
  ]);

  if (!mareCandidate.candidate || !stallionCandidate.candidate) {
    return {
      analysis: null,
      mareProfile: mareTraits.profile,
      stallionProfile: stallionTraits.profile,
      error: mareCandidate.error ?? stallionCandidate.error ?? "One or both selected horses could not be loaded.",
    };
  }

  if (!mareTraits.profile || !stallionTraits.profile) {
    return {
      analysis: null,
      mareProfile: mareTraits.profile,
      stallionProfile: stallionTraits.profile,
      error: mareTraits.error ?? stallionTraits.error ?? "Trait evidence is not available for one or both selected horses.",
    };
  }

  // The UI may start the cross-analysis before BreedingGoalsPanel has finished
  // loading the persisted goals. When goals are not supplied by the client,
  // load them here so analysis never silently falls back to an empty goal set.
  let goals = input.goals;
  if (!goals) {
    const persisted = await getMareBreedingGoals(input.marePedigreeId);
    if (persisted.error) {
      return {
        analysis: null,
        mareProfile: mareTraits.profile,
        stallionProfile: stallionTraits.profile,
        error: persisted.error,
      };
    }

    goals = persisted.goals ?? {
      marePedigreeId: input.marePedigreeId,
      improveGoals: [],
      preserveTraits: [],
      avoidReinforcingWeaknesses: true,
    } satisfies MareBreedingGoals;
  }

  return {
    analysis: analyzeBreedingGoalsCross(mareTraits.profile, stallionTraits.profile, goals),
    mareProfile: mareTraits.profile,
    stallionProfile: stallionTraits.profile,
  };
}
