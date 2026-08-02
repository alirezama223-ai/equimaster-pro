import type { SupabaseClient } from "@supabase/supabase-js";
import { canManageTraitAssessments } from "@/app/lib/traits/access";
import { activateSessionForStart } from "@/app/lib/training/activate-session";
import { ensureTodayTrainingSession } from "@/app/lib/training/generator";

export type StartTrainingSessionResult = {
  sessionId?: string;
  existing?: boolean;
  error?: string;
};

export async function startTrainingSession(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string
): Promise<StartTrainingSessionResult> {
  const canManage = await canManageTraitAssessments(supabase, pedigreeHorseId, userId);
  if (!canManage) {
    return { error: "You do not have access to this horse." };
  }

  const ensureResult = await ensureTodayTrainingSession(supabase, userId, pedigreeHorseId);

  if (!ensureResult.sessionId) {
    if (ensureResult.skipped && ensureResult.skipReason === "no_plan") {
      return { error: "No active training plan is assigned to this horse." };
    }

    if (ensureResult.skipped && ensureResult.skipReason === "before_plan_start") {
      return { error: "Today's session is before the active plan start date." };
    }

    return { error: ensureResult.error ?? "Unable to start today's training session." };
  }

  const { data: sessionRow, error: statusError } = await supabase
    .from("training_sessions")
    .select("status")
    .eq("id", ensureResult.sessionId)
    .eq("created_by", userId)
    .maybeSingle();

  if (statusError || !sessionRow) {
    return { error: statusError?.message ?? "Training session not found." };
  }

  const activationResult = await activateSessionForStart(
    supabase,
    userId,
    ensureResult.sessionId,
    sessionRow.status as string
  );

  if (activationResult.error) {
    return { error: activationResult.error };
  }

  if (ensureResult.error) {
    return {
      sessionId: ensureResult.sessionId,
      existing: !ensureResult.created,
      error: ensureResult.error,
    };
  }

  return {
    sessionId: ensureResult.sessionId,
    existing: !ensureResult.created,
  };
}
