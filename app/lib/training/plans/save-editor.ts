import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSaveTrainingPlanPayload } from "@/app/lib/training/plans/editor-serialize";
import type { TrainingPlanEditorWeek } from "@/app/lib/training/plans/editor-types";
import { fetchTrainingPlanEditor } from "@/app/lib/training/plans/fetch-editor";

/** @deprecated Use saveTrainingPlanEditorState from assignments.ts */
export async function saveTrainingPlanStructure(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  weeks: TrainingPlanEditorWeek[]
): Promise<{ plan: Awaited<ReturnType<typeof fetchTrainingPlanEditor>>["plan"]; error?: string }> {
  const payload = buildSaveTrainingPlanPayload(weeks);

  const { error } = await supabase.rpc("save_training_plan_structure", {
    p_training_plan_id: planId,
    p_weeks: payload.weeks,
  });

  if (error) {
    return {
      plan: null,
      error: error.message.includes("save_training_plan_structure")
        ? "Plan save function is not available yet. Run migration 022 in Supabase."
        : error.message,
    };
  }

  return fetchTrainingPlanEditor(supabase, userId, planId);
}
