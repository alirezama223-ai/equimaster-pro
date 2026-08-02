import type { SupabaseClient } from "@supabase/supabase-js";
import { formatHealthDate } from "@/app/lib/health/format";
import type {
  FarrierVisit,
  HealthCheck,
  HorseInjury,
  Medication,
  Vaccination,
  VetVisit,
} from "@/app/types/health";

function mapHealthCheck(row: Record<string, unknown>): HealthCheck {
  const checkDate = String(row.check_date);
  return {
    id: row.id as string,
    pedigreeHorseId: row.pedigree_horse_id as string,
    checkDate,
    checkDateLabel: formatHealthDate(checkDate),
    temperatureCelsius: (row.temperature_celsius as number | null | undefined) ?? null,
    appetite: (row.appetite as HealthCheck["appetite"] | null | undefined) ?? null,
    hydration: (row.hydration as HealthCheck["hydration"] | null | undefined) ?? null,
    attitude: (row.attitude as HealthCheck["attitude"] | null | undefined) ?? null,
    manure: (row.manure as HealthCheck["manure"] | null | undefined) ?? null,
    lamenessObserved: Boolean(row.lameness_observed),
    lamenessNotes: (row.lameness_notes as string | null | undefined)?.trim() || null,
    feverObserved: Boolean(row.fever_observed),
    notes: (row.notes as string | null | undefined)?.trim() || null,
  };
}

function mapInjury(row: Record<string, unknown>): HorseInjury {
  const injuryDate = String(row.injury_date);
  return {
    id: row.id as string,
    pedigreeHorseId: row.pedigree_horse_id as string,
    injuryDate,
    injuryDateLabel: formatHealthDate(injuryDate),
    bodyArea: String(row.body_area),
    severity: row.severity as HorseInjury["severity"],
    status: row.status as HorseInjury["status"],
    description: (row.description as string | null | undefined)?.trim() || null,
    treatmentNotes: (row.treatment_notes as string | null | undefined)?.trim() || null,
    resolvedAt: (row.resolved_at as string | null | undefined) ?? null,
  };
}

function mapFarrierVisit(row: Record<string, unknown>): FarrierVisit {
  const visitDate = String(row.visit_date);
  const nextDueDate = (row.next_due_date as string | null | undefined) ?? null;
  return {
    id: row.id as string,
    pedigreeHorseId: row.pedigree_horse_id as string,
    visitDate,
    visitDateLabel: formatHealthDate(visitDate),
    nextDueDate,
    nextDueDateLabel: nextDueDate ? formatHealthDate(nextDueDate) : null,
    workDone: (row.work_done as string | null | undefined)?.trim() || null,
    notes: (row.notes as string | null | undefined)?.trim() || null,
  };
}

function mapVetVisit(row: Record<string, unknown>): VetVisit {
  const visitDate = String(row.visit_date);
  const followUpDate = (row.follow_up_date as string | null | undefined) ?? null;
  return {
    id: row.id as string,
    pedigreeHorseId: row.pedigree_horse_id as string,
    visitDate,
    visitDateLabel: formatHealthDate(visitDate),
    reason: String(row.reason),
    diagnosis: (row.diagnosis as string | null | undefined)?.trim() || null,
    treatment: (row.treatment as string | null | undefined)?.trim() || null,
    followUpDate,
    followUpDateLabel: followUpDate ? formatHealthDate(followUpDate) : null,
    notes: (row.notes as string | null | undefined)?.trim() || null,
  };
}

function mapVaccination(row: Record<string, unknown>): Vaccination {
  const administeredDate = String(row.administered_date);
  const nextDueDate = (row.next_due_date as string | null | undefined) ?? null;
  return {
    id: row.id as string,
    pedigreeHorseId: row.pedigree_horse_id as string,
    vaccineName: String(row.vaccine_name),
    administeredDate,
    administeredDateLabel: formatHealthDate(administeredDate),
    nextDueDate,
    nextDueDateLabel: nextDueDate ? formatHealthDate(nextDueDate) : null,
    batchNumber: (row.batch_number as string | null | undefined)?.trim() || null,
    notes: (row.notes as string | null | undefined)?.trim() || null,
  };
}

function mapMedication(row: Record<string, unknown>): Medication {
  const startDate = String(row.start_date);
  const endDate = (row.end_date as string | null | undefined) ?? null;
  return {
    id: row.id as string,
    pedigreeHorseId: row.pedigree_horse_id as string,
    medicationName: String(row.medication_name),
    startDate,
    startDateLabel: formatHealthDate(startDate),
    endDate,
    endDateLabel: endDate ? formatHealthDate(endDate) : null,
    dosage: (row.dosage as string | null | undefined)?.trim() || null,
    frequency: (row.frequency as string | null | undefined)?.trim() || null,
    reason: (row.reason as string | null | undefined)?.trim() || null,
    isActive: Boolean(row.is_active),
    notes: (row.notes as string | null | undefined)?.trim() || null,
  };
}

function isMissingTableError(message: string): boolean {
  return (
    message.includes("horse_health_checks") ||
    message.includes("horse_injuries") ||
    message.includes("horse_farrier_visits") ||
    message.includes("horse_vet_visits") ||
    message.includes("horse_vaccinations") ||
    message.includes("horse_medications") ||
    message.includes("does not exist")
  );
}

export async function fetchHealthChecks(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 14
): Promise<{ checks: HealthCheck[]; error?: string }> {
  const { data, error } = await supabase
    .from("horse_health_checks")
    .select("*")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .order("check_date", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) {
      return { checks: [], error: "Health tables are not available yet. Run migration 026 in Supabase." };
    }
    return { checks: [], error: error.message };
  }

  return { checks: (data ?? []).map(mapHealthCheck) };
}

export async function fetchHealthCheckForDate(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  checkDate: string
): Promise<{ check: HealthCheck | null; error?: string }> {
  const { data, error } = await supabase
    .from("horse_health_checks")
    .select("*")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .eq("check_date", checkDate)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      return { check: null };
    }
    return { check: null, error: error.message };
  }

  return { check: data ? mapHealthCheck(data) : null };
}

export async function fetchInjuries(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 20
): Promise<{ injuries: HorseInjury[]; error?: string }> {
  const { data, error } = await supabase
    .from("horse_injuries")
    .select("*")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .order("injury_date", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) return { injuries: [] };
    return { injuries: [], error: error.message };
  }

  return { injuries: (data ?? []).map(mapInjury) };
}

export async function fetchFarrierVisits(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 10
): Promise<{ visits: FarrierVisit[]; error?: string }> {
  const { data, error } = await supabase
    .from("horse_farrier_visits")
    .select("*")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .order("visit_date", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) return { visits: [] };
    return { visits: [], error: error.message };
  }

  return { visits: (data ?? []).map(mapFarrierVisit) };
}

export async function fetchVetVisits(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 10
): Promise<{ visits: VetVisit[]; error?: string }> {
  const { data, error } = await supabase
    .from("horse_vet_visits")
    .select("*")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .order("visit_date", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) return { visits: [] };
    return { visits: [], error: error.message };
  }

  return { visits: (data ?? []).map(mapVetVisit) };
}

export async function fetchVaccinations(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 20
): Promise<{ vaccinations: Vaccination[]; error?: string }> {
  const { data, error } = await supabase
    .from("horse_vaccinations")
    .select("*")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .order("administered_date", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) return { vaccinations: [] };
    return { vaccinations: [], error: error.message };
  }

  return { vaccinations: (data ?? []).map(mapVaccination) };
}

export async function fetchMedications(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 20
): Promise<{ medications: Medication[]; error?: string }> {
  const { data, error } = await supabase
    .from("horse_medications")
    .select("*")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .order("start_date", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) return { medications: [] };
    return { medications: [], error: error.message };
  }

  return { medications: (data ?? []).map(mapMedication) };
}
