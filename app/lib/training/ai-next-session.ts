import type { SupabaseClient } from "@supabase/supabase-js";
import { canManageTraitAssessments } from "@/app/lib/traits/access";
import { defaultSessionTitle, toDateOnlyString } from "@/app/lib/training/format";
import { fetchAssignedActivePlanForHorse } from "@/app/lib/training/plans/assignments";
import { fetchPlanDayTemplate } from "@/app/lib/training/generator/plan-day";
import { resolveEffectivePlanStartDate, resolvePlanDayPosition } from "@/app/lib/training/generator/schedule";

export type ApplyTrainingAiNextSessionResult = {
  sessionId?: string;
  sessionDate?: string;
  created?: boolean;
  error?: string;
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function buildAiGoal(nextSession: string[]): string {
  const instructions = nextSession
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (instructions.length === 0) {
    return "AI-guided next session: maintain relaxation, rhythm, and responsiveness.";
  }

  return `AI-guided next session: ${instructions.join(" • ")}`;
}

async function findNextPlannedSession(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  startDate: string
) {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, session_date, status, training_plan_id")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .gte("session_date", startDate)
    .in("status", ["planned", "in_progress"])
    .order("session_date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { data, error };
}

export async function applyTrainingAiToNextSession(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  nextSession: string[]
): Promise<ApplyTrainingAiNextSessionResult> {
  const canManage = await canManageTraitAssessments(supabase, pedigreeHorseId, userId);
  if (!canManage) {
    return { error: "You do not have access to this horse." };
  }

  const planResult = await fetchAssignedActivePlanForHorse(supabase, userId, pedigreeHorseId);
  if (planResult.error) return { error: planResult.error };
  if (!planResult.plan) return { error: "No active training plan is assigned to this horse." };

  const today = new Date();
  const todayDate = toDateOnlyString(today);
  const firstCandidate = toDateOnlyString(addDays(today, 1));

  const existingResult = await findNextPlannedSession(
    supabase,
    userId,
    pedigreeHorseId,
    firstCandidate
  );

  if (existingResult.error) {
    return { error: existingResult.error.message };
  }

  const aiGoal = buildAiGoal(nextSession);

  if (existingResult.data?.id) {
    const { error } = await supabase
      .from("training_sessions")
      .update({
        session_goal: aiGoal,
        title: `AI-guided ${defaultSessionTitle(existingResult.data.session_date as string)}`,
      })
      .eq("id", existingResult.data.id)
      .eq("created_by", userId);

    if (error) return { error: error.message };

    return {
      sessionId: existingResult.data.id as string,
      sessionDate: existingResult.data.session_date as string,
      created: false,
    };
  }

  const effectiveStartDate = resolveEffectivePlanStartDate(planResult.plan.start_date, today);
  let sessionDate = firstCandidate;
  let template = null;

  for (let offset = 1; offset <= 14; offset += 1) {
    const candidateDate = addDays(today, offset);
    const position = resolvePlanDayPosition(effectiveStartDate, candidateDate);
    if (!position) continue;

    const templateResult = await fetchPlanDayTemplate(
      supabase,
      planResult.plan.id,
      position.weekNumber,
      position.dayNumber
    );

    if (templateResult.error) return { error: templateResult.error };
    if (!templateResult.template || !templateResult.template.isRestDay) {
      sessionDate = toDateOnlyString(candidateDate);
      template = templateResult.template;
      break;
    }
  }

  const sessionGoal = template?.goal?.trim()
    ? `${template.goal.trim()} ${aiGoal}`
    : aiGoal;

  const { data: createdSession, error: createError } = await supabase
    .from("training_sessions")
    .insert({
      created_by: userId,
      pedigree_horse_id: pedigreeHorseId,
      training_plan_id: planResult.plan.id,
      session_date: sessionDate,
      status: "planned",
      session_goal: sessionGoal,
      title: `AI-guided ${defaultSessionTitle(sessionDate)}`,
    })
    .select("id, session_date")
    .single();

  if (createError) return { error: createError.message };

  if (template && template.exercises.length > 0) {
    const rows = template.exercises.map((exercise) => ({
      training_session_id: createdSession.id as string,
      exercise_id: exercise.exerciseId,
      sort_order: exercise.sortOrder,
      duration_minutes: exercise.durationMinutes,
      notes: exercise.notes,
    }));

    const { error: exerciseError } = await supabase
      .from("training_session_exercises")
      .insert(rows);

    if (exerciseError) {
      await supabase
        .from("training_sessions")
        .delete()
        .eq("id", createdSession.id as string)
        .eq("created_by", userId);
      return { error: `Session created but exercises could not be copied: ${exerciseError.message}` };
    }
  }

  return {
    sessionId: createdSession.id as string,
    sessionDate: createdSession.session_date as string,
    created: true,
  };
}
