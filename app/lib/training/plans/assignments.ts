import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSaveTrainingPlanPayload } from "@/app/lib/training/plans/editor-serialize";
import type { TrainingPlanEditorWeek } from "@/app/lib/training/plans/editor-types";
import { fetchTrainingPlanEditor } from "@/app/lib/training/plans/fetch-editor";

export type TrainingPlanAssignmentRow = {
  pedigree_horse_id: string;
};

export async function fetchTrainingPlanAssignmentHorseIds(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<{ horseIds: string[]; error?: string }> {
  const { data, error } = await supabase
    .from("training_plan_assignments")
    .select("pedigree_horse_id")
    .eq("training_plan_id", planId)
    .eq("created_by", userId)
    .order("created_at", { ascending: true });

  if (error) {
    const message = error.message.includes("does not exist")
      ? "Training plan assignment tables are not available yet. Run migration 023 in Supabase."
      : error.message;

    return { horseIds: [], error: message };
  }

  return {
    horseIds: (data ?? []).map((row) => row.pedigree_horse_id as string),
  };
}

export async function fetchAssignedHorseCountsByPlanId(
  supabase: SupabaseClient,
  userId: string,
  planIds: string[]
): Promise<{ counts: Map<string, number>; error?: string }> {
  const counts = new Map<string, number>();
  if (planIds.length === 0) {
    return { counts };
  }

  const { data, error } = await supabase
    .from("training_plan_assignments")
    .select("training_plan_id")
    .eq("created_by", userId)
    .in("training_plan_id", planIds);

  if (error) {
    if (error.message.includes("does not exist")) {
      for (const planId of planIds) {
        counts.set(planId, 0);
      }
      return { counts };
    }

    return { counts, error: error.message };
  }

  for (const planId of planIds) {
    counts.set(planId, 0);
  }

  for (const row of data ?? []) {
    const planId = row.training_plan_id as string;
    counts.set(planId, (counts.get(planId) ?? 0) + 1);
  }

  return { counts };
}

export type AssignedActivePlanRow = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  status: string;
};

export async function fetchAssignedActivePlanForHorse(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string
): Promise<{ plan: AssignedActivePlanRow | null; error?: string }> {
  const { data, error } = await supabase
    .from("training_plan_assignments")
    .select("training_plans!inner(id, name, description, start_date, status, created_by)")
    .eq("pedigree_horse_id", pedigreeHorseId)
    .eq("created_by", userId)
    .maybeSingle();

  if (error) {
    if (error.message.includes("does not exist")) {
      return { plan: null };
    }

    return { plan: null, error: error.message };
  }

  if (!data) {
    return { plan: null };
  }

  const plan = data.training_plans as AssignedActivePlanRow | AssignedActivePlanRow[] | null;
  const planRow = Array.isArray(plan) ? plan[0] : plan;

  if (!planRow || planRow.status !== "active") {
    return { plan: null };
  }

  return { plan: planRow };
}

type SaveTrainingPlanEditorOptions = {
  weeks: TrainingPlanEditorWeek[];
  assignedHorseIds: string[];
  saveStructure: boolean;
  saveAssignments: boolean;
};

export async function saveTrainingPlanEditorState(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  options: SaveTrainingPlanEditorOptions
): Promise<{ plan: Awaited<ReturnType<typeof fetchTrainingPlanEditor>>["plan"]; error?: string }> {
  const { weeks, assignedHorseIds, saveStructure, saveAssignments } = options;

  if (!saveStructure && !saveAssignments) {
    return fetchTrainingPlanEditor(supabase, userId, planId);
  }

  if (saveStructure && saveAssignments) {
    const payload = buildSaveTrainingPlanPayload(weeks);
    const { error } = await supabase.rpc("save_training_plan_full_state", {
      p_training_plan_id: planId,
      p_weeks: payload.weeks,
      p_horse_ids: assignedHorseIds,
    });

    if (error) {
      return {
        plan: null,
        error: resolveSaveErrorMessage(error.message),
      };
    }

    return fetchTrainingPlanEditor(supabase, userId, planId);
  }

  if (saveStructure) {
    const payload = buildSaveTrainingPlanPayload(weeks);
    const { error } = await supabase.rpc("save_training_plan_structure", {
      p_training_plan_id: planId,
      p_weeks: payload.weeks,
    });

    if (error) {
      return {
        plan: null,
        error: resolveSaveErrorMessage(error.message),
      };
    }
  }

  if (saveAssignments) {
    const { error } = await supabase.rpc("save_training_plan_assignments", {
      p_training_plan_id: planId,
      p_horse_ids: assignedHorseIds,
    });

    if (error) {
      return {
        plan: null,
        error: resolveSaveErrorMessage(error.message, "assignments"),
      };
    }
  }

  return fetchTrainingPlanEditor(supabase, userId, planId);
}

function resolveSaveErrorMessage(message: string, scope: "structure" | "assignments" = "structure"): string {
  if (message.includes("save_training_plan_full_state")) {
    return "Plan save function is not available yet. Run migration 023 in Supabase.";
  }

  if (message.includes("save_training_plan_assignments")) {
    return "Plan assignment save function is not available yet. Run migration 023 in Supabase.";
  }

  if (message.includes("save_training_plan_structure")) {
    return "Plan structure save function is not available yet. Run migration 022 in Supabase.";
  }

  if (scope === "assignments") {
    return message;
  }

  return message;
}
