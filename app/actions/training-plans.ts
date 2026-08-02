"use server";

import { revalidatePath } from "next/cache";
import { fetchManageableTrainingHorses } from "@/app/lib/training/queries";
import { fetchExerciseLibrary } from "@/app/lib/training/plans/exercise-library";
import { fetchTrainingPlanEditor } from "@/app/lib/training/plans/fetch-editor";
import { fetchTrainingPlansList, createTrainingPlan, updateTrainingPlanStatus, deleteTrainingPlan } from "@/app/lib/training/plans/queries";
import { saveTrainingPlanEditorState } from "@/app/lib/training/plans/assignments";
import { createClient } from "@/app/lib/supabase/server";
import type { TrainingPlanEditorData, TrainingPlanEditorWeek } from "@/app/lib/training/plans/editor-types";
import type { ExerciseLibraryItem } from "@/app/lib/training/plans/exercises";
import type { TrainingHorse } from "@/app/types/training";
import type { TrainingPlanListItem, TrainingPlanStatus } from "@/app/types/training-plans";

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
    return { supabase, user: null, error: "You must be signed in to view training plans." };
  }

  return { supabase, user, error: undefined };
}

export async function getTrainingPlans(): Promise<{
  plans: TrainingPlanListItem[];
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { plans: [], error: auth.error };
  }

  return fetchTrainingPlansList(auth.supabase, auth.user.id);
}

export async function getTrainingHorses(): Promise<{
  horses: TrainingHorse[];
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { horses: [], error: auth.error };
  }

  return fetchManageableTrainingHorses(auth.supabase, auth.user.id);
}

export async function getExerciseLibrary(): Promise<{
  exercises: ExerciseLibraryItem[];
  error?: string;
}> {
  console.log("[getExerciseLibrary] server action called");
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    console.log("[getExerciseLibrary] auth failed", { error: auth.error ?? null });
    return { exercises: [], error: auth.error };
  }

  const { data: sessionData, error: sessionError } = await auth.supabase.auth.getSession();
  console.log("[getExerciseLibrary] auth context", {
    userId: auth.user.id,
    hasSession: Boolean(sessionData.session),
    sessionError: sessionError?.message ?? null,
    accessTokenPresent: Boolean(sessionData.session?.access_token),
  });

  const result = await fetchExerciseLibrary(auth.supabase, auth.user.id);

  console.log("[getExerciseLibrary] returned to client", {
    exerciseCount: result.exercises.length,
    error: result.error ?? null,
    sample: result.exercises.slice(0, 3).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
    })),
  });

  return result;
}

export async function getTrainingPlanEditor(planId: string): Promise<{
  plan: TrainingPlanEditorData | null;
  error?: string;
  assignmentError?: string;
}> {
  if (!isUuid(planId)) {
    return { plan: null, error: "Invalid training plan." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { plan: null, error: auth.error };
  }

  return fetchTrainingPlanEditor(auth.supabase, auth.user.id, planId);
}

type SaveTrainingPlanEditorInput = {
  weeks: TrainingPlanEditorWeek[];
  assignedHorseIds: string[];
  saveStructure: boolean;
  saveAssignments: boolean;
};

export async function saveTrainingPlanEditor(
  planId: string,
  input: SaveTrainingPlanEditorInput
): Promise<{
  plan: TrainingPlanEditorData | null;
  error?: string;
}> {
  if (!isUuid(planId)) {
    return { plan: null, error: "Invalid training plan." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { plan: null, error: auth.error };
  }

  const result = await saveTrainingPlanEditorState(auth.supabase, auth.user.id, planId, {
    weeks: input.weeks,
    assignedHorseIds: input.assignedHorseIds,
    saveStructure: input.saveStructure,
    saveAssignments: input.saveAssignments,
  });

  if (result.error || !result.plan) {
    return { plan: null, error: result.error ?? "Unable to save training plan." };
  }

  revalidatePath("/training/plans");
  revalidatePath(`/training/plans/${planId}`);
  revalidatePath("/training");

  return result;
}

export async function createTrainingPlanAction(input: {
  name: string;
  description?: string | null;
  startDate?: string | null;
}): Promise<{ planId: string | null; error?: string }> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { planId: null, error: auth.error };
  }

  const result = await createTrainingPlan(auth.supabase, auth.user.id, input);
  if (result.planId) {
    revalidatePath("/training/plans");
  }

  return result;
}

export async function updateTrainingPlanStatusAction(
  planId: string,
  status: TrainingPlanStatus
): Promise<{ error?: string }> {
  if (!isUuid(planId)) {
    return { error: "Invalid training plan." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { error: auth.error };
  }

  const result = await updateTrainingPlanStatus(auth.supabase, auth.user.id, planId, status);
  if (!result.error) {
    revalidatePath("/training/plans");
    revalidatePath(`/training/plans/${planId}`);
    revalidatePath("/training");
  }

  return result;
}

export async function deleteTrainingPlanAction(planId: string): Promise<{ error?: string }> {
  if (!isUuid(planId)) {
    return { error: "Invalid training plan." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { error: auth.error };
  }

  const result = await deleteTrainingPlan(auth.supabase, auth.user.id, planId);
  if (!result.error) {
    revalidatePath("/training/plans");
    revalidatePath("/training");
  }

  return result;
}
