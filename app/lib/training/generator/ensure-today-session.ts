import type { SupabaseClient } from "@supabase/supabase-js";
import { canManageTraitAssessments } from "@/app/lib/traits/access";
import { defaultSessionTitle, toDateOnlyString } from "@/app/lib/training/format";
import { fetchPlanDayTemplate, type PlanDayTemplate } from "@/app/lib/training/generator/plan-day";
import {
  resolveEffectivePlanStartDate,
  resolvePlanDayPosition,
} from "@/app/lib/training/generator/schedule";
import { fetchAssignedActivePlanForHorse } from "@/app/lib/training/plans/assignments";

const ENSURE_TODAY_LOG_PREFIX = "[ensureTodayTrainingSession]";

function logEnsureToday(step: string, detail: Record<string, unknown>) {
  console.log(ENSURE_TODAY_LOG_PREFIX, step, detail);
}

function logEnsureTodayEarlyReturn(reason: string, detail: Record<string, unknown> = {}) {
  console.log(ENSURE_TODAY_LOG_PREFIX, "EARLY_RETURN", { reason, ...detail });
}

export type EnsureTodayTrainingSessionResult = {
  sessionId: string | null;
  created: boolean;
  synced?: boolean;
  skipped?: boolean;
  skipReason?: "no_plan" | "before_plan_start" | "no_access";
  error?: string;
};

type ActivePlan = {
  id: string;
  description: string | null;
  start_date: string | null;
};

async function fetchTodaySessionRow(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  sessionDate: string
) {
  return supabase
    .from("training_sessions")
    .select("id, session_goal, title, training_plan_id, status")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .eq("session_date", sessionDate)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

async function fetchSessionExerciseCount(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ count: number; error?: string }> {
  const { count, error } = await supabase
    .from("training_session_exercises")
    .select("id", { count: "exact", head: true })
    .eq("training_session_id", sessionId);

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: count ?? 0 };
}

function resolveSessionGoal(
  dayGoal: string | null,
  planDescription: string | null
): string | null {
  const trimmedDayGoal = dayGoal?.trim();
  if (trimmedDayGoal) {
    return trimmedDayGoal;
  }

  const trimmedPlanDescription = planDescription?.trim();
  return trimmedPlanDescription || null;
}

async function copyPlanExercisesToSession(
  supabase: SupabaseClient,
  sessionId: string,
  template: PlanDayTemplate
): Promise<string | undefined> {
  if (template.isRestDay || template.exercises.length === 0) {
    logEnsureToday("9. session exercises inserted", {
      sessionId,
      inserted: false,
      reason: template.isRestDay ? "rest_day" : "no_plan_exercises",
    });
    return undefined;
  }

  const rows = template.exercises.map((exercise) => ({
    training_session_id: sessionId,
    exercise_id: exercise.exerciseId,
    sort_order: exercise.sortOrder,
    duration_minutes: exercise.durationMinutes,
    notes: exercise.notes,
  }));

  const { error } = await supabase.from("training_session_exercises").insert(rows);
  logEnsureToday("9. session exercises inserted", {
    sessionId,
    inserted: !error,
    count: rows.length,
    error: error?.message ?? null,
  });
  return error?.message;
}

async function clearSessionExercises(
  supabase: SupabaseClient,
  sessionId: string
): Promise<string | undefined> {
  const { error } = await supabase
    .from("training_session_exercises")
    .delete()
    .eq("training_session_id", sessionId);

  return error?.message;
}

async function syncSessionWithActivePlan(
  supabase: SupabaseClient,
  sessionId: string,
  plan: ActivePlan,
  template: PlanDayTemplate | null,
  existingPlanId: string | null | undefined
): Promise<{ synced: boolean; error?: string }> {
  const sessionGoal = resolveSessionGoal(template?.goal ?? null, plan.description);
  const normalizedExistingPlanId = existingPlanId ?? null;
  const needsPlanLink = normalizedExistingPlanId !== plan.id;
  const planChanged =
    normalizedExistingPlanId !== null && normalizedExistingPlanId !== plan.id;
  const linkResult = await fetchSessionExerciseCount(supabase, sessionId);
  const hasTemplateExercises = Boolean(
    template && !template.isRestDay && template.exercises.length > 0
  );
  const needsExercises =
    hasTemplateExercises && (linkResult.count === 0 || planChanged);

  if (!needsPlanLink && !needsExercises && !sessionGoal) {
    logEnsureToday("9. session exercises inserted", {
      sessionId,
      inserted: false,
      reason: "existing session already linked and has exercises",
      existingExerciseCount: linkResult.count,
    });
    return { synced: false };
  }

  if (needsPlanLink || sessionGoal) {
    const { error: updateError } = await supabase
      .from("training_sessions")
      .update({
        training_plan_id: plan.id,
        ...(sessionGoal ? { session_goal: sessionGoal } : {}),
      })
      .eq("id", sessionId);

    if (updateError) {
      return { synced: false, error: updateError.message };
    }
  }

  if (needsExercises && template) {
    if (planChanged && linkResult.count > 0) {
      const clearError = await clearSessionExercises(supabase, sessionId);
      if (clearError) {
        return {
          synced: needsPlanLink,
          error: `Session linked to plan but existing exercises could not be replaced: ${clearError}`,
        };
      }
    }

    const copyError = await copyPlanExercisesToSession(supabase, sessionId, template);
    if (copyError) {
      return {
        synced: needsPlanLink,
        error: `Session linked to plan but exercises could not be copied: ${copyError}`,
      };
    }
  }

  return { synced: needsPlanLink || needsExercises };
}

async function createTodaySessionFromPlan(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  sessionDate: string,
  plan: ActivePlan,
  template: PlanDayTemplate | null
): Promise<{ sessionId: string | null; error?: string }> {
  const sessionGoal = resolveSessionGoal(template?.goal ?? null, plan.description);

  const { data: createdSession, error: createError } = await supabase
    .from("training_sessions")
    .insert({
      created_by: userId,
      pedigree_horse_id: pedigreeHorseId,
      training_plan_id: plan.id,
      session_date: sessionDate,
      status: "planned",
      session_goal: sessionGoal,
      title: defaultSessionTitle(sessionDate),
    })
    .select("id")
    .single();

  if (createError) {
    logEnsureToday("8. session inserted", {
      inserted: false,
      error: createError.message,
    });
    return { sessionId: null, error: createError.message };
  }

  const sessionId = createdSession.id as string;
  logEnsureToday("8. session inserted", {
    inserted: true,
    sessionId,
    trainingPlanId: plan.id,
    sessionDate,
  });

  if (template && !template.isRestDay && template.exercises.length > 0) {
    const copyError = await copyPlanExercisesToSession(supabase, sessionId, template);
    if (copyError) {
      return {
        sessionId,
        error: `Session created but exercises could not be copied: ${copyError}`,
      };
    }
  } else {
    logEnsureToday("9. session exercises inserted", {
      sessionId,
      inserted: false,
      reason: !template
        ? "no_plan_day_template"
        : template.isRestDay
          ? "rest_day"
          : "no_plan_exercises",
    });
  }

  return { sessionId };
}

export async function ensureTodayTrainingSession(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  referenceDate: Date = new Date()
): Promise<EnsureTodayTrainingSessionResult> {
  const sessionDate = toDateOnlyString(referenceDate);

  logEnsureToday("1. horse id received", {
    pedigreeHorseId,
    userId,
    sessionDate,
    referenceDate: referenceDate.toISOString(),
  });

  const canManage = await canManageTraitAssessments(supabase, pedigreeHorseId, userId);
  if (!canManage) {
    logEnsureTodayEarlyReturn("no_access", { pedigreeHorseId, userId });
    return { sessionId: null, created: false, skipped: true, skipReason: "no_access" };
  }

  const planResult = await fetchAssignedActivePlanForHorse(supabase, userId, pedigreeHorseId);

  const { data: assignmentRow, error: assignmentLookupError } = await supabase
    .from("training_plan_assignments")
    .select("training_plan_id")
    .eq("pedigree_horse_id", pedigreeHorseId)
    .eq("created_by", userId)
    .maybeSingle();

  logEnsureToday("2. active plan found", {
    activePlanId: planResult.plan?.id ?? null,
    planStatus: planResult.plan?.status ?? null,
    planStartDate: planResult.plan?.start_date ?? null,
    fetchError: planResult.error ?? null,
  });

  logEnsureToday("3. assignment found", {
    found: Boolean(assignmentRow),
    assignmentTrainingPlanId: assignmentRow?.training_plan_id ?? null,
    lookupError: assignmentLookupError?.message ?? null,
  });

  if (planResult.error) {
    logEnsureTodayEarlyReturn("plan_fetch_error", {
      error: planResult.error,
      pedigreeHorseId,
    });
    return { sessionId: null, created: false, error: planResult.error };
  }

  if (!planResult.plan) {
    logEnsureTodayEarlyReturn("no_plan", {
      pedigreeHorseId,
      assignmentFound: Boolean(assignmentRow),
      assignmentTrainingPlanId: assignmentRow?.training_plan_id ?? null,
    });
    return { sessionId: null, created: false, skipped: true, skipReason: "no_plan" };
  }

  const activePlan: ActivePlan = {
    id: planResult.plan.id,
    description: planResult.plan.description,
    start_date: planResult.plan.start_date,
  };

  const effectiveStartDate = resolveEffectivePlanStartDate(activePlan.start_date, referenceDate);

  logEnsureToday("4. effective start date", {
    planStartDate: activePlan.start_date,
    effectiveStartDate,
    usedFallback: !activePlan.start_date?.trim(),
  });

  if (activePlan.start_date) {
    const anchoredPosition = resolvePlanDayPosition(activePlan.start_date, referenceDate);
    logEnsureToday("5. today week/day position (anchored on plan start_date)", {
      startDate: activePlan.start_date,
      position: anchoredPosition,
    });
    if (!anchoredPosition) {
      logEnsureTodayEarlyReturn("before_plan_start", {
        reason: "reference date is before plan start_date",
        planStartDate: activePlan.start_date,
        sessionDate,
      });
      return { sessionId: null, created: false, skipped: true, skipReason: "before_plan_start" };
    }
  }

  const position = resolvePlanDayPosition(effectiveStartDate, referenceDate);
  logEnsureToday("5. today week/day position (effective)", {
    effectiveStartDate,
    position,
  });
  if (!position) {
    logEnsureTodayEarlyReturn("before_plan_start", {
      reason: "no position resolved from effective start date",
      effectiveStartDate,
      sessionDate,
    });
    return { sessionId: null, created: false, skipped: true, skipReason: "before_plan_start" };
  }

  const planDayResult = await fetchPlanDayTemplate(
    supabase,
    activePlan.id,
    position.weekNumber,
    position.dayNumber
  );

  logEnsureToday("6. plan day template found", {
    found: Boolean(planDayResult.template),
    weekNumber: position.weekNumber,
    dayNumber: position.dayNumber,
    isRestDay: planDayResult.template?.isRestDay ?? null,
    exerciseCount: planDayResult.template?.exercises.length ?? 0,
    goal: planDayResult.template?.goal ?? null,
    fetchError: planDayResult.error ?? null,
  });

  if (planDayResult.error) {
    logEnsureTodayEarlyReturn("plan_day_template_error", {
      error: planDayResult.error,
      activePlanId: activePlan.id,
      weekNumber: position.weekNumber,
      dayNumber: position.dayNumber,
    });
    return { sessionId: null, created: false, error: planDayResult.error };
  }

  const existingSessionResult = await fetchTodaySessionRow(
    supabase,
    userId,
    pedigreeHorseId,
    sessionDate
  );

  logEnsureToday("7. existing session found", {
    found: Boolean(existingSessionResult.data?.id),
    sessionId: existingSessionResult.data?.id ?? null,
    trainingPlanId: existingSessionResult.data?.training_plan_id ?? null,
    status: existingSessionResult.data?.status ?? null,
    lookupError: existingSessionResult.error?.message ?? null,
  });

  if (existingSessionResult.error) {
    logEnsureTodayEarlyReturn("existing_session_lookup_error", {
      error: existingSessionResult.error.message,
      pedigreeHorseId,
      sessionDate,
    });
    return { sessionId: null, created: false, error: existingSessionResult.error.message };
  }

  if (existingSessionResult.data?.id) {
    const sessionId = existingSessionResult.data.id as string;
    const syncResult = await syncSessionWithActivePlan(
      supabase,
      sessionId,
      activePlan,
      planDayResult.template,
      existingSessionResult.data.training_plan_id as string | null | undefined
    );

    logEnsureToday("8. session inserted", {
      inserted: false,
      reason: "existing session reused",
      sessionId,
      synced: syncResult.synced,
    });

    if (syncResult.error) {
      logEnsureTodayEarlyReturn("sync_existing_session_error", {
        error: syncResult.error,
        sessionId,
        synced: syncResult.synced,
      });
      return { sessionId, created: false, synced: syncResult.synced, error: syncResult.error };
    }

    logEnsureToday("COMPLETE", {
      sessionId,
      created: false,
      synced: syncResult.synced,
    });
    return { sessionId, created: false, synced: syncResult.synced };
  }

  const createResult = await createTodaySessionFromPlan(
    supabase,
    userId,
    pedigreeHorseId,
    sessionDate,
    activePlan,
    planDayResult.template
  );

  if (createResult.error || !createResult.sessionId) {
    logEnsureTodayEarlyReturn("create_session_failed", {
      error: createResult.error ?? "missing session id after insert",
      sessionId: createResult.sessionId,
    });
    return {
      sessionId: createResult.sessionId,
      created: Boolean(createResult.sessionId),
      error: createResult.error,
    };
  }

  logEnsureToday("COMPLETE", {
    sessionId: createResult.sessionId,
    created: true,
    synced: false,
  });
  return { sessionId: createResult.sessionId, created: true };
}
