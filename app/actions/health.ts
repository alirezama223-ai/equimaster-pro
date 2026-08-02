"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { canManageTraitAssessments } from "@/app/lib/traits/access";
import { fetchHorseHealthDashboard } from "@/app/lib/health/horse-health";
import { fetchHealthCheckForDate } from "@/app/lib/health/queries";
import { fetchManageableTrainingHorses } from "@/app/lib/training/queries";
import { createClient } from "@/app/lib/supabase/server";
import { todayIsoDate } from "@/app/lib/health/format";
import type {
  DailyHealthCheckInput,
  HorseHealthDashboard,
  HorseHealthDashboardErrors,
} from "@/app/types/health";
import type { TrainingHorse } from "@/app/types/training";

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
    return { supabase, user: null, error: "You must be signed in to manage health records." };
  }

  return { supabase, user, error: undefined };
}

type HorseAccessSuccess = {
  supabase: SupabaseClient;
  user: User;
  horseName: string;
};

type HorseAccessResult = { error: string } | HorseAccessSuccess;

function isHorseAccessSuccess(access: HorseAccessResult): access is HorseAccessSuccess {
  return "supabase" in access;
}

async function requireHorseAccess(pedigreeHorseId: string): Promise<HorseAccessResult> {
  if (!isUuid(pedigreeHorseId)) {
    return { error: "Invalid horse selection." as const };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { error: auth.error ?? "Authentication required." };
  }

  const canManage = await canManageTraitAssessments(auth.supabase, pedigreeHorseId, auth.user.id);
  if (!canManage) {
    return { error: "You do not have access to this horse." };
  }

  const horsesResult = await fetchManageableTrainingHorses(auth.supabase, auth.user.id);
  const horseName =
    horsesResult.horses.find((horse) => horse.id === pedigreeHorseId)?.name ?? "Unknown horse";

  return {
    supabase: auth.supabase,
    user: auth.user,
    horseName,
  };
}

export async function getHealthDashboardHorses(): Promise<{
  horses: TrainingHorse[];
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { horses: [], error: auth.error };
  }

  return fetchManageableTrainingHorses(auth.supabase, auth.user.id);
}

export async function getHorseHealthDashboard(pedigreeHorseId: string): Promise<{
  dashboard: HorseHealthDashboard | null;
  horseName?: string;
  errors?: HorseHealthDashboardErrors;
  error?: string;
}> {
  const access = await requireHorseAccess(pedigreeHorseId);
  if (!isHorseAccessSuccess(access)) {
    return { dashboard: null, error: access.error };
  }

  const result = await fetchHorseHealthDashboard(
    access.supabase,
    access.user.id,
    pedigreeHorseId,
    access.horseName
  );

  return {
    dashboard: result.dashboard,
    horseName: access.horseName,
    errors: result.errors,
  };
}

export async function getTodayHealthCheck(pedigreeHorseId: string): Promise<{
  check: Awaited<ReturnType<typeof fetchHealthCheckForDate>>["check"];
  error?: string;
}> {
  const access = await requireHorseAccess(pedigreeHorseId);
  if (!isHorseAccessSuccess(access)) {
    return { check: null, error: access.error };
  }

  return fetchHealthCheckForDate(
    access.supabase,
    access.user.id,
    pedigreeHorseId,
    todayIsoDate()
  );
}

export async function saveDailyHealthCheck(
  input: DailyHealthCheckInput
): Promise<{ success: boolean; error?: string }> {
  const access = await requireHorseAccess(input.pedigreeHorseId);
  if (!isHorseAccessSuccess(access)) {
    return { success: false, error: access.error };
  }

  const payload = {
    created_by: access.user.id,
    pedigree_horse_id: input.pedigreeHorseId,
    check_date: input.checkDate || todayIsoDate(),
    temperature_celsius: input.temperatureCelsius ?? null,
    appetite: input.appetite ?? null,
    hydration: input.hydration ?? null,
    attitude: input.attitude ?? null,
    manure: input.manure ?? null,
    lameness_observed: input.lamenessObserved ?? false,
    lameness_notes: input.lamenessNotes?.trim() || null,
    fever_observed: input.feverObserved ?? false,
    notes: input.notes?.trim() || null,
  };

  const { error } = await access.supabase
    .from("horse_health_checks")
    .upsert(payload, { onConflict: "created_by,pedigree_horse_id,check_date" });

  if (error) {
    if (error.message.includes("horse_health_checks") || error.message.includes("does not exist")) {
      return { success: false, error: "Health tables are not available yet. Run migration 026 in Supabase." };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function createHorseInjury(input: {
  pedigreeHorseId: string;
  injuryDate: string;
  bodyArea: string;
  severity: "mild" | "moderate" | "severe";
  description?: string;
  treatmentNotes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const access = await requireHorseAccess(input.pedigreeHorseId);
  if (!isHorseAccessSuccess(access)) {
    return { success: false, error: access.error };
  }

  const { error } = await access.supabase.from("horse_injuries").insert({
    created_by: access.user.id,
    pedigree_horse_id: input.pedigreeHorseId,
    injury_date: input.injuryDate,
    body_area: input.bodyArea.trim(),
    severity: input.severity,
    description: input.description?.trim() || null,
    treatment_notes: input.treatmentNotes?.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function createFarrierVisit(input: {
  pedigreeHorseId: string;
  visitDate: string;
  nextDueDate?: string | null;
  workDone?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const access = await requireHorseAccess(input.pedigreeHorseId);
  if (!isHorseAccessSuccess(access)) {
    return { success: false, error: access.error };
  }

  const { error } = await access.supabase.from("horse_farrier_visits").insert({
    created_by: access.user.id,
    pedigree_horse_id: input.pedigreeHorseId,
    visit_date: input.visitDate,
    next_due_date: input.nextDueDate ?? null,
    work_done: input.workDone?.trim() || null,
    notes: input.notes?.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function createVaccination(input: {
  pedigreeHorseId: string;
  vaccineName: string;
  administeredDate: string;
  nextDueDate?: string | null;
  batchNumber?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const access = await requireHorseAccess(input.pedigreeHorseId);
  if (!isHorseAccessSuccess(access)) {
    return { success: false, error: access.error };
  }

  const { error } = await access.supabase.from("horse_vaccinations").insert({
    created_by: access.user.id,
    pedigree_horse_id: input.pedigreeHorseId,
    vaccine_name: input.vaccineName.trim(),
    administered_date: input.administeredDate,
    next_due_date: input.nextDueDate ?? null,
    batch_number: input.batchNumber?.trim() || null,
    notes: input.notes?.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function resolveHorseInjury(
  injuryId: string,
  pedigreeHorseId: string
): Promise<{ success: boolean; error?: string }> {
  const access = await requireHorseAccess(pedigreeHorseId);
  if (!isHorseAccessSuccess(access)) {
    return { success: false, error: access.error };
  }

  const { error } = await access.supabase
    .from("horse_injuries")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", injuryId)
    .eq("created_by", access.user.id)
    .eq("pedigree_horse_id", pedigreeHorseId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
