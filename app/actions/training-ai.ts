"use server";

import { canManageTraitAssessments } from "@/app/lib/traits/access";
import { fetchManageableTrainingHorses } from "@/app/lib/training/queries";
import { fetchHorseTrainingAnalytics } from "@/app/lib/training/horse-analytics";
import { applyTrainingAiToNextSession } from "@/app/lib/training/ai-next-session";
import { generateTrainingAiCoach, type TrainingAiCoachResult } from "@/app/lib/training/ai-coach";
import { createClient } from "@/app/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireTrainingUser() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { supabase, user: null, error: "You must be signed in to use Training AI." };
  return { supabase, user, error: undefined };
}

export async function getTrainingAiCoach(pedigreeHorseId: string): Promise<{
  result: TrainingAiCoachResult | null;
  error?: string;
}> {
  if (!UUID_PATTERN.test(pedigreeHorseId)) return { result: null, error: "Invalid horse selection." };

  const auth = await requireTrainingUser();
  if (!auth.user) return { result: null, error: auth.error };

  const canManage = await canManageTraitAssessments(auth.supabase, pedigreeHorseId, auth.user.id);
  if (!canManage) return { result: null, error: "You do not have access to this horse." };

  const horses = await fetchManageableTrainingHorses(auth.supabase, auth.user.id);
  const horseName = horses.horses.find((horse) => horse.id === pedigreeHorseId)?.name ?? "Unknown horse";
  const analytics = await fetchHorseTrainingAnalytics(auth.supabase, auth.user.id, pedigreeHorseId, horseName);

  if (!analytics.analytics) {
    return { result: null, error: "Training analytics are not available for this horse yet." };
  }

  try {
    return { result: await generateTrainingAiCoach(analytics.analytics) };
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : "Training AI could not generate an assessment.",
    };
  }
}

export async function applyTrainingAiNextSessionAction(
  pedigreeHorseId: string,
  nextSession: string[]
): Promise<{ sessionId?: string; sessionDate?: string; created?: boolean; error?: string }> {
  if (!UUID_PATTERN.test(pedigreeHorseId)) return { error: "Invalid horse selection." };
  if (!Array.isArray(nextSession)) return { error: "Invalid AI session recommendation." };

  const auth = await requireTrainingUser();
  if (!auth.user) return { error: auth.error };

  return applyTrainingAiToNextSession(
    auth.supabase,
    auth.user.id,
    pedigreeHorseId,
    nextSession
  );
}
