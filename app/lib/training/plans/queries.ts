import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAssignedHorseCountsByPlanId } from "@/app/lib/training/plans/assignments";
import { formatTrainingPlanDuration } from "@/app/lib/training/plans/format";
import type { TrainingPlan, TrainingPlanListItem, TrainingPlanStatus } from "@/app/types/training-plans";

type TrainingPlanRow = {
  id: string;
  created_by: string;
  name: string;
  description: string | null;
  status: TrainingPlanStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

function mapTrainingPlanRow(row: TrainingPlanRow): TrainingPlan {
  return {
    id: row.id,
    createdBy: row.created_by,
    name: row.name,
    description: row.description,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchTrainingPlansList(
  supabase: SupabaseClient,
  userId: string
): Promise<{ plans: TrainingPlanListItem[]; error?: string }> {
  const { data, error } = await supabase
    .from("training_plans")
    .select("id, created_by, name, description, status, start_date, end_date, created_at, updated_at")
    .eq("created_by", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return { plans: [], error: error.message };
  }

  const rows = (data ?? []) as TrainingPlanRow[];
  const planIds = rows.map((row) => row.id);
  const assignedCountsResult = await fetchAssignedHorseCountsByPlanId(supabase, userId, planIds);

  const plans = rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    durationLabel: formatTrainingPlanDuration(row.start_date, row.end_date),
    assignedHorseCount: assignedCountsResult.counts.get(row.id) ?? 0,
    description: row.description,
  }));

  return {
    plans,
    error: assignedCountsResult.error,
  };
}

export async function fetchTrainingPlanById(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<{ plan: TrainingPlan | null; error?: string }> {
  const { data, error } = await supabase
    .from("training_plans")
    .select("id, created_by, name, description, status, start_date, end_date, created_at, updated_at")
    .eq("id", planId)
    .eq("created_by", userId)
    .maybeSingle();

  if (error) {
    return { plan: null, error: error.message };
  }

  if (!data) {
    return { plan: null };
  }

  return { plan: mapTrainingPlanRow(data as TrainingPlanRow) };
}

export type CreateTrainingPlanInput = {
  name: string;
  description?: string | null;
  startDate?: string | null;
};

export async function createTrainingPlan(
  supabase: SupabaseClient,
  userId: string,
  input: CreateTrainingPlanInput
): Promise<{ planId: string | null; error?: string }> {
  const name = input.name.trim();
  if (!name) {
    return { planId: null, error: "Plan name is required." };
  }

  const { data, error } = await supabase
    .from("training_plans")
    .insert({
      created_by: userId,
      name,
      description: input.description?.trim() || null,
      start_date: input.startDate || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    return { planId: null, error: error.message };
  }

  return { planId: data.id as string };
}

export async function updateTrainingPlanStatus(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  status: TrainingPlanStatus
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("training_plans")
    .update({ status })
    .eq("id", planId)
    .eq("created_by", userId);

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function deleteTrainingPlan(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<{ error?: string }> {
  const { data, error } = await supabase
    .from("training_plans")
    .delete()
    .eq("id", planId)
    .eq("created_by", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Training plan not found or access denied." };
  }

  return {};
}
