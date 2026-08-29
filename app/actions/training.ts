"use server";

import { syncHorseEventsAction } from "@/app/actions/events";
import { revalidatePath } from "next/cache";
import { finishTrainingSession } from "@/app/lib/training/finish-session";
import {
  ensureSessionInProgress,
  fetchTrainingSessionDetail,
  saveSessionReflection,
} from "@/app/lib/training/session-lifecycle";
import { fetchSessionExercises, updateSessionExercise } from "@/app/lib/training/session-exercises";
import { fetchManageableTrainingHorses, fetchTrainingHorseDashboard, fetchTodaySession } from "@/app/lib/training/queries";
import { createEmptyTrainingCalendarMonth } from "@/app/lib/training/calendar";
import { trainingSessionPath } from "@/app/lib/training/routes";
import { startTrainingSession } from "@/app/lib/training/start-session";
import { createClient } from "@/app/lib/supabase/server";
import type {
  TrainingDashboardErrors,
  TrainingHorse,
  TrainingHorseDashboard,
  TrainingSessionDetail,
  TrainingSessionExercise,
  TrainingSessionExerciseStatus,
  TrainingSessionReflection,
} from "@/app/types/training";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { supabase, user: null, error: error.message };
  }

  if (!user) {
    return { supabase, user: null, error: "You must be signed in to view training." };
  }

  return { supabase, user, error: undefined };
}

async function fallbackTrainingHorses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{ horses: TrainingHorse[]; error?: string }> {
  const { data, error } = await supabase
    .from("pedigree_horses")
    .select("id, name, sex")
    .eq("created_by", userId)
    .order("name", { ascending: true });

  if (error) return { horses: [], error: error.message };

  const horses = (data ?? [])
    .filter((row) => isUuid(row.id as string))
    .map((row) => ({
      id: row.id as string,
      name: String(row.name ?? "Unknown horse"),
      sex: String(row.sex ?? "unknown"),
      discipline: "—",
      subtitle: String(row.sex ?? "—"),
    }));

  return { horses };
}

export async function getTrainingHorses(): Promise<{
  horses: TrainingHorse[];
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { horses: [], error: auth.error };
  }

  const result = await fetchManageableTrainingHorses(auth.supabase, auth.user.id);
  if (!result.error) return result;

  const fallback = await fallbackTrainingHorses(auth.supabase, auth.user.id);
  if (fallback.horses.length > 0) return fallback;

  return result;
}

export async function getTrainingHorseDashboard(pedigreeHorseId: string): Promise<{
  dashboard: TrainingHorseDashboard;
  errors?: TrainingDashboardErrors;
}> {
  if (!isUuid(pedigreeHorseId)) {
    return {
      dashboard: {
        plan: null,
        todayExercises: [],
        recentSessions: [],
        summary: {
          totalSessions: 0,
          completedSessions: 0,
          completionRateLabel: "0%",
          lastSessionDate: null,
          lastSessionDateLabel: null,
        },
        activity: [],
        recentNotes: [],
        calendar: createEmptyTrainingCalendarMonth(),
      },
      errors: { general: "Invalid horse selection." },
    };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return {
      dashboard: {
        plan: null,
        todayExercises: [],
        recentSessions: [],
        summary: {
          totalSessions: 0,
          completedSessions: 0,
          completionRateLabel: "0%",
          lastSessionDate: null,
          lastSessionDateLabel: null,
        },
        activity: [],
        recentNotes: [],
        calendar: createEmptyTrainingCalendarMonth(),
      },
      errors: { general: auth.error },
    };
  }

  const result = await fetchTrainingHorseDashboard(auth.supabase, auth.user.id, pedigreeHorseId);
  void syncHorseEventsAction(pedigreeHorseId);
  return result;
}

export async function startTrainingSessionAction(pedigreeHorseId: string): Promise<{
  sessionId?: string;
  existing?: boolean;
  error?: string;
}> {
  if (!isUuid(pedigreeHorseId)) {
    return { error: "Invalid horse selection." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { error: auth.error };
  }

  return startTrainingSession(auth.supabase, auth.user.id, pedigreeHorseId);
}

export async function getTrainingSession(sessionId: string): Promise<{
  session: TrainingSessionDetail | null;
  exercises: TrainingSessionExercise[];
  error?: string;
}> {
  if (!isUuid(sessionId)) {
    return { session: null, exercises: [], error: "Invalid session." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { session: null, exercises: [], error: auth.error };
  }

  const sessionResult = await fetchTrainingSessionDetail(auth.supabase, auth.user.id, sessionId);
  if (sessionResult.error) {
    return { session: null, exercises: [], error: sessionResult.error };
  }

  if (!sessionResult.session) {
    return { session: null, exercises: [] };
  }

  if (sessionResult.session.status !== "completed") {
    const progressResult = await ensureSessionInProgress(auth.supabase, auth.user.id, sessionId);
    if (progressResult.error) {
      return { session: sessionResult.session, exercises: [], error: progressResult.error };
    }
    sessionResult.session = {
      ...sessionResult.session,
      status: "in_progress",
      startedAt: progressResult.startedAt,
    };
  }

  const exerciseResult = await fetchSessionExercises(auth.supabase, sessionId);

  return {
    session: sessionResult.session,
    exercises: exerciseResult.exercises,
    error: exerciseResult.error,
  };
}

export async function getTrainingTodayExercisesAction(pedigreeHorseId: string): Promise<{
  exercises: TrainingSessionExercise[];
  error?: string;
}> {
  if (!isUuid(pedigreeHorseId)) {
    return { exercises: [], error: "Invalid horse selection." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { exercises: [], error: auth.error };
  }

  const today = new Date().toISOString().slice(0, 10);
  const sessionResult = await fetchTodaySession(
    auth.supabase,
    auth.user.id,
    pedigreeHorseId,
    today
  );

  if (sessionResult.error) {
    return { exercises: [], error: sessionResult.error.message };
  }

  if (!sessionResult.data?.id) {
    return { exercises: [] };
  }

  return fetchSessionExercises(auth.supabase, sessionResult.data.id as string);
}

export async function updateSessionExerciseAction(
  sessionExerciseId: string,
  input: {
    status?: TrainingSessionExerciseStatus;
    executionNotes?: string | null;
  }
): Promise<{ exercise: TrainingSessionExercise | null; error?: string }> {
  if (!isUuid(sessionExerciseId)) {
    return { exercise: null, error: "Invalid exercise." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { exercise: null, error: auth.error };
  }

  return updateSessionExercise(auth.supabase, auth.user.id, sessionExerciseId, input);
}

export async function saveSessionReflectionAction(
  sessionId: string,
  reflection: TrainingSessionReflection
): Promise<{ error?: string }> {
  if (!isUuid(sessionId)) {
    return { error: "Invalid session." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { error: auth.error };
  }

  return saveSessionReflection(auth.supabase, auth.user.id, sessionId, reflection);
}

export async function finishTrainingSessionAction(
  sessionId: string,
  input: TrainingSessionReflection & { durationMinutes: number }
): Promise<{ success?: boolean; error?: string }> {
  if (!isUuid(sessionId)) {
    return { error: "Invalid session." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { error: auth.error };
  }

  const result = await finishTrainingSession(auth.supabase, auth.user.id, sessionId, input);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/training");
  revalidatePath(trainingSessionPath(sessionId));

  return { success: true };
}
