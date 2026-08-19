"use server";

import { getBreedingCandidateById } from "@/app/actions/breeding";
import { getHorseTraitProfile } from "@/app/actions/traits";
import { analyzeBreedingGoalsCross } from "@/app/lib/breeding-goals/analyze";
import { buildHorseTraitProfile } from "@/app/lib/traits/aggregate";
import { createDemoGoalEvidence, isShabdizDemoHorseName } from "@/app/lib/demo/demo-goal-profile";
import { BreedingGoalAnalysisResult, HorseTraitProfile, MareBreedingGoals } from "@/app/types/traits";

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

  if (!mareTraits.profile || !stallionTraits.profile) {
    return {
      analysis: null,
      mareProfile: mareTraits.profile,
      stallionProfile: stallionTraits.profile,
      error: mareTraits.error ?? stallionTraits.error,
    };
  }

  let mareProfile = mareTraits.profile;
  let stallionProfile = stallionTraits.profile;

  const goals = input.goals ?? {
    marePedigreeId: input.marePedigreeId,
    improveGoals: [],
    preserveTraits: [],
    avoidReinforcingWeaknesses: true,
  } satisfies MareBreedingGoals;

  if (mareCandidate.candidate && isShabdizDemoHorseName(mareCandidate.candidate.name)) {
    const demoEvidence = createDemoGoalEvidence(
      input.marePedigreeId,
      mareCandidate.candidate.name
    );
    mareProfile = buildHorseTraitProfile(input.marePedigreeId, [
      ...demoEvidence,
    ]);
  }

  if (stallionCandidate.candidate && isShabdizDemoHorseName(stallionCandidate.candidate.name)) {
    const demoEvidence = createDemoGoalEvidence(
      input.stallionPedigreeId,
      stallionCandidate.candidate.name
    );
    stallionProfile = buildHorseTraitProfile(input.stallionPedigreeId, [
      ...demoEvidence,
    ]);
  }

  return {
    analysis: analyzeBreedingGoalsCross(mareProfile, stallionProfile, goals),
    mareProfile,
    stallionProfile,
  };
}
