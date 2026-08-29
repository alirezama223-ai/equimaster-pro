import type { SupabaseClient } from "@supabase/supabase-js";
import { canManageTraitAssessments } from "@/app/lib/traits/access";
import {
  computePlanSchedule,
  defaultSessionTitle,
  formatTrainingHorseSubtitle,
  toDateOnlyString,
} from "@/app/lib/training/format";
import type {
  TrainingDashboardErrors,
  TrainingExerciseExecutionStatus,
  TrainingExerciseItem,
  TrainingHorse,
  TrainingHorseDashboard,
  TrainingSessionStatus,
  TrainingSummary,
  TrainingTodayPlan,
} from "@/app/types/training";
import {
  fetchRecentSessionNotes,
  fetchRecentSessions,
  fetchTrainingActivity,
  fetchTrainingSummary,
} from "@/app/lib/training/analytics";
import { createEmptyTrainingCalendarMonth, fetchTrainingCalendarMonth } from "@/app/lib/training/calendar";
import { ensureTodayTrainingSession } from "@/app/lib/training/generator";
import { fetchAssignedActivePlanForHorse } from "@/app/lib/training/plans/assignments";
import { fetchDemoHorseFilter } from "@/app/lib/demo/preferences";

const EMPTY_SUMMARY: TrainingSummary = {
  totalSessions: 0,
  completedSessions: 0,
  completionRateLabel: "0%",
  lastSessionDate: null,
  lastSessionDateLabel: null,
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

type DisciplineSource = {
  pedigree_horse_id: string;
  discipline: string | null;
};

async function collectDisciplineSources(
  supabase: SupabaseClient,
  userId: string
): Promise<DisciplineSource[]> {
  const [{ data: listings }, { data: ownedStallions }, { data: breeders }] = await Promise.all([
    supabase
      .from("horse_listings")
      .select("pedigree_horse_id, discipline")
      .eq("user_id", userId)
      .not("pedigree_horse_id", "is", null),
    supabase
      .from("stallions")
      .select("pedigree_horse_id, discipline")
      .eq("owner_id", userId)
      .not("pedigree_horse_id", "is", null),
    supabase.from("breeders").select("id").eq("owner_id", userId),
  ]);

  const sources: DisciplineSource[] = [
    ...((listings ?? []) as DisciplineSource[]),
    ...((ownedStallions ?? []) as DisciplineSource[]),
  ];

  const breederIds = (breeders ?? []).map((row) => row.id as string);
  if (breederIds.length > 0) {
    const { data: breederStallions } = await supabase
      .from("stallions")
      .select("pedigree_horse_id, discipline")
      .in("breeder_id", breederIds)
      .not("pedigree_horse_id", "is", null);

    sources.push(...((breederStallions ?? []) as DisciplineSource[]));
  }

  return sources.filter((source) => isUuid(source.pedigree_horse_id));
}

function buildDisciplineMap(sources: DisciplineSource[]): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const source of sources) {
    if (!source.pedigree_horse_id || map.has(source.pedigree_horse_id)) continue;
    map.set(source.pedigree_horse_id, source.discipline ?? null);
  }
  return map;
}

export async function fetchManageableTrainingHorses(
  supabase: SupabaseClient,
  userId: string
): Promise<{ horses: TrainingHorse[]; error?: string }> {
  const disciplineSources = await collectDisciplineSources(supabase, userId);
  const disciplineMap = buildDisciplineMap(disciplineSources);

  const horseIds = new Set<string>();

  const [{ data: createdHorses }, { data: listingLinks }, { data: ownedStallionLinks }] =
    await Promise.all([
      supabase.from("pedigree_horses").select("id").eq("created_by", userId),
      supabase
        .from("horse_listings")
        .select("pedigree_horse_id")
        .eq("user_id", userId)
        .not("pedigree_horse_id", "is", null),
      supabase
        .from("stallions")
        .select("pedigree_horse_id")
        .eq("owner_id", userId)
        .not("pedigree_horse_id", "is", null),
    ]);

  for (const row of createdHorses ?? []) {
    if (isUuid(row.id)) horseIds.add(row.id);
  }
  for (const row of listingLinks ?? []) {
    if (isUuid(row.pedigree_horse_id)) horseIds.add(row.pedigree_horse_id);
  }
  for (const row of ownedStallionLinks ?? []) {
    if (isUuid(row.pedigree_horse_id)) horseIds.add(row.pedigree_horse_id);
  }

  for (const source of disciplineSources) {
    if (isUuid(source.pedigree_horse_id)) horseIds.add(source.pedigree_horse_id);
  }

  if (horseIds.size === 0) return { horses: [] };

  const { data: pedigreeRows, error } = await supabase
    .from("pedigree_horses")
    .select("id, name, sex")
    .in("id", [...horseIds])
    .order("name", { ascending: true });

  if (error) return { horses: [], error: error.message };

  const horses = (pedigreeRows ?? []).map((row) => {
    const discipline = disciplineMap.get(row.id as string) ?? null;
    const sex = String(row.sex);
    return {
      id: row.id as string,
      name: row.name as string,
      sex,
      discipline: discipline?.trim() || "—",
      subtitle: formatTrainingHorseSubtitle(sex, discipline),
    };
  });

  const { demoModeEnabled, demoHorseIds } = await fetchDemoHorseFilter(supabase, userId);
  const filteredHorses =
    !demoModeEnabled && demoHorseIds.size > 0
      ? horses.filter((horse) => !demoHorseIds.has(horse.id))
      : horses;

  return { horses: filteredHorses };
}

export async function fetchActiveTrainingPlanForHorse(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string
): Promise<{ plan: Record<string, unknown> | null; error?: string }> {
  const result = await fetchAssignedActivePlanForHorse(supabase, userId, pedigreeHorseId);
  if (result.error) return { plan: null, error: result.error };
  if (!result.plan) return { plan: null };
  return {
    plan: {
      id: result.plan.id,
      name: result.plan.name,
      description: result.plan.description,
      start_date: result.plan.start_date,
      status: result.plan.status,
    },
  };
}

export async function fetchTodaySession(
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

export async function fetchInProgressSessionToday(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  sessionDate: string
) {
  return supabase
    .from("training_sessions")
    .select("id")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .eq("session_date", sessionDate)
    .eq("status", "in_progress")
    .maybeSingle();
}

export type SessionExerciseLink = {
  exercise_id: string;
  sort_order: number;
  duration_minutes: number | null;
};

export async function fetchSessionExerciseLinks(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ links: SessionExerciseLink[]; error?: string }> {
  const { data, error } = await supabase
    .from("training_session_exercises")
    .select("exercise_id, sort_order, duration_minutes")
    .eq("training_session_id", sessionId)
    .order("sort_order", { ascending: true });
  if (error) return { links: [], error: error.message };
  return {
    links: (data ?? []).map((row) => ({
      exercise_id: row.exercise_id as string,
      sort_order: row.sort_order as number,
      duration_minutes: (row.duration_minutes as number | null | undefined) ?? null,
    })),
  };
}

export async function fetchTrainingSessionById(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string
): Promise<{
  session: {
    id: string;
    status: TrainingSessionStatus;
    sessionDate: string;
    title: string;
    sessionGoal: string | null;
    pedigreeHorseId: string;
    horseName: string;
    trainingPlanId: string | null;
  } | null;
  error?: string;
}> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, status, session_date, title, session_goal, pedigree_horse_id, training_plan_id, pedigree_horses(name)")
    .eq("id", sessionId)
    .eq("created_by", userId)
    .maybeSingle();
  if (error) return { session: null, error: error.message };
  if (!data) return { session: null };
  const horse = data.pedigree_horses as { name?: string } | null;
  const sessionDate = String(data.session_date);
  return {
    session: {
      id: data.id as string,
      status: data.status as TrainingSessionStatus,
      sessionDate,
      title: (data.title as string | null)?.trim() || defaultSessionTitle(sessionDate),
      sessionGoal: (data.session_goal as string | null | undefined) ?? null,
      pedigreeHorseId: data.pedigree_horse_id as string,
      horseName: horse?.name?.trim() || "Unknown horse",
      trainingPlanId: (data.training_plan_id as string | null | undefined) ?? null,
    },
  };
}

function normalizeExerciseStatus(value: unknown): TrainingExerciseExecutionStatus {
  if (value === "in_progress" || value === "completed" || value === "skipped") return value;
  return "pending";
}

export async function fetchTodayExercises(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ exercises: TrainingExerciseItem[]; error?: string }> {
  const extended = await supabase
    .from("training_session_exercises")
    .select("id, sort_order, exercises(name), status")
    .eq("training_session_id", sessionId)
    .order("sort_order", { ascending: true });

  let rows = extended.data as Record<string, unknown>[] | null;
  let error = extended.error;

  if (error && (error.message.includes("status") || error.message.includes("does not exist"))) {
    const fallback = await supabase
      .from("training_session_exercises")
      .select("id, sort_order, exercises(name)")
      .eq("training_session_id", sessionId)
      .order("sort_order", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error) return { exercises: [], error: error.message };

  return {
    exercises: (rows ?? []).map((row) => {
      const exercise = row.exercises as { name?: string } | null;
      return {
        id: row.id as string,
        label: exercise?.name?.trim() || "Untitled exercise",
        status: normalizeExerciseStatus(row.status),
      };
    }),
  };
}

function buildTodayPlan(
  planRow: Record<string, unknown>,
  todaySessionGoal: string | null,
  referenceDate: Date
): TrainingTodayPlan {
  const planName = String(planRow.name);
  const startDate = planRow.start_date as string | null;
  const schedule = startDate ? computePlanSchedule(startDate, referenceDate) : { week: "—", day: "—" };
  const goal = todaySessionGoal?.trim() || (planRow.description as string | null)?.trim() || "No goal set for today.";
  return { planName, week: schedule.week, day: schedule.day, goal };
}

export async function fetchTrainingHorseDashboard(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string
): Promise<{ dashboard: TrainingHorseDashboard; errors?: TrainingDashboardErrors }> {
  const canManage = await canManageTraitAssessments(supabase, pedigreeHorseId, userId);
  if (!canManage) {
    return {
      dashboard: {
        plan: null,
        todayExercises: [],
        recentSessions: [],
        summary: EMPTY_SUMMARY,
        activity: [],
        recentNotes: [],
        calendar: createEmptyTrainingCalendarMonth(),
      },
      errors: { general: "You do not have access to this horse." },
    };
  }

  const today = toDateOnlyString(new Date());
  const errors: TrainingDashboardErrors = {};
  const generationResult = await ensureTodayTrainingSession(supabase, userId, pedigreeHorseId, new Date());
  if (generationResult.error) errors.exercises = generationResult.error;

  const [planResult, todaySessionResult, recentResult, summaryResult, activityResult, notesResult, calendarResult] =
    await Promise.all([
      fetchActiveTrainingPlanForHorse(supabase, userId, pedigreeHorseId),
      fetchTodaySession(supabase, userId, pedigreeHorseId, today),
      fetchRecentSessions(supabase, userId, pedigreeHorseId, 3),
      fetchTrainingSummary(supabase, userId, pedigreeHorseId),
      fetchTrainingActivity(supabase, userId, pedigreeHorseId),
      fetchRecentSessionNotes(supabase, userId, pedigreeHorseId),
      fetchTrainingCalendarMonth(supabase, userId, pedigreeHorseId),
    ]);

  if (planResult.error) errors.plan = planResult.error;
  if (todaySessionResult.error) errors.exercises = todaySessionResult.error.message;
  if (recentResult.error) errors.sessions = recentResult.error;
  if (summaryResult.error) errors.summary = summaryResult.error;
  if (activityResult.error) errors.activity = activityResult.error;
  if (notesResult.error) errors.notes = notesResult.error;
  if (calendarResult.error) errors.calendar = calendarResult.error;

  let todayExercises: TrainingExerciseItem[] = [];
  const todaySessionId = todaySessionResult.data?.id as string | undefined;
  if (todaySessionId) {
    const exerciseResult = await fetchTodayExercises(supabase, todaySessionId);
    if (exerciseResult.error) errors.exercises = exerciseResult.error;
    todayExercises = exerciseResult.exercises;
  }

  const plan = planResult.plan
    ? buildTodayPlan(
        planResult.plan,
        (todaySessionResult.data?.session_goal as string | null | undefined) ?? null,
        new Date()
      )
    : null;

  const hasErrors = Object.keys(errors).length > 0;
  return {
    dashboard: {
      plan,
      todayExercises,
      recentSessions: recentResult.sessions,
      summary: summaryResult.summary,
      activity: activityResult.activity,
      recentNotes: notesResult.notes,
      calendar: calendarResult.calendar,
    },
    errors: hasErrors ? errors : undefined,
  };
}
