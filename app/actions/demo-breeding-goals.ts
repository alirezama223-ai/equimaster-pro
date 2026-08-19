"use server";

import { getBreedingCandidateById } from "@/app/actions/breeding";
import { getHorseTraitProfile } from "@/app/actions/traits";
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

  const goals = input.goals ?? {
    marePedigreeId: input.marePedigreeId,
    improveGoals: [],
    preserveTraits: [],
    avoidReinforcingWeaknesses: true,
  } satisfies MareBreedingGoals;

  return {
    analysis: analyzeBreedingGoalsCross(mareTraits.profile, stallionTraits.profile, goals),
    mareProfile: mareTraits.profile,
    stallionProfile: stallionTraits.profile,
  };
}
