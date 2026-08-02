import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchFarrierVisits,
  fetchHealthChecks,
  fetchInjuries,
  fetchMedications,
  fetchVaccinations,
  fetchVetVisits,
} from "@/app/lib/health/queries";
import { evaluateHealthRules } from "@/app/lib/health/rules";
import { isOverdue, todayIsoDate } from "@/app/lib/health/format";
import type {
  HorseHealthDashboard,
  HorseHealthDashboardErrors,
  HorseHealthSnapshot,
} from "@/app/types/health";

function buildSnapshot(
  pedigreeHorseId: string,
  horseName: string,
  checks: Awaited<ReturnType<typeof fetchHealthChecks>>["checks"],
  injuries: Awaited<ReturnType<typeof fetchInjuries>>["injuries"],
  farrierVisits: Awaited<ReturnType<typeof fetchFarrierVisits>>["visits"],
  vaccinations: Awaited<ReturnType<typeof fetchVaccinations>>["vaccinations"],
  medications: Awaited<ReturnType<typeof fetchMedications>>["medications"],
  vetVisits: Awaited<ReturnType<typeof fetchVetVisits>>["visits"]
): HorseHealthSnapshot {
  const activeInjuries = injuries.filter((injury) =>
    injury.status === "active" || injury.status === "recovering"
  );
  const overdueVaccinations = vaccinations.filter((vaccination) =>
    isOverdue(vaccination.nextDueDate, todayIsoDate())
  );

  return {
    pedigreeHorseId,
    horseName,
    latestCheck: checks[0] ?? null,
    recentChecks: checks,
    activeInjuries,
    latestFarrierVisit: farrierVisits[0] ?? null,
    overdueVaccinations,
    activeMedications: medications.filter((medication) => medication.isActive),
    recentVetVisits: vetVisits,
    vaccinationRecordCount: vaccinations.length,
  };
}

export async function fetchHorseHealthDashboard(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  horseName: string
): Promise<{ dashboard: HorseHealthDashboard; errors?: HorseHealthDashboardErrors }> {
  const errors: HorseHealthDashboardErrors = {};

  const [
    checksResult,
    injuriesResult,
    farrierResult,
    vetResult,
    vaccinationsResult,
    medicationsResult,
  ] = await Promise.all([
    fetchHealthChecks(supabase, userId, pedigreeHorseId),
    fetchInjuries(supabase, userId, pedigreeHorseId),
    fetchFarrierVisits(supabase, userId, pedigreeHorseId),
    fetchVetVisits(supabase, userId, pedigreeHorseId),
    fetchVaccinations(supabase, userId, pedigreeHorseId),
    fetchMedications(supabase, userId, pedigreeHorseId),
  ]);

  if (checksResult.error) errors.checks = checksResult.error;
  if (injuriesResult.error) errors.injuries = injuriesResult.error;
  if (farrierResult.error) errors.farrier = farrierResult.error;
  if (vetResult.error) errors.vet = vetResult.error;
  if (vaccinationsResult.error) errors.vaccinations = vaccinationsResult.error;
  if (medicationsResult.error) errors.medications = medicationsResult.error;

  const snapshot = buildSnapshot(
    pedigreeHorseId,
    horseName,
    checksResult.checks,
    injuriesResult.injuries,
    farrierResult.visits,
    vaccinationsResult.vaccinations,
    medicationsResult.medications,
    vetResult.visits
  );

  const evaluation = evaluateHealthRules(snapshot);

  return {
    dashboard: {
      snapshot,
      evaluation,
      checks: checksResult.checks,
      injuries: injuriesResult.injuries,
      farrierVisits: farrierResult.visits,
      vetVisits: vetResult.visits,
      vaccinations: vaccinationsResult.vaccinations,
      medications: medicationsResult.medications,
    },
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

export async function fetchHorseHealthSnapshot(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  horseName: string
): Promise<{ snapshot: HorseHealthSnapshot; error?: string }> {
  const result = await fetchHorseHealthDashboard(supabase, userId, pedigreeHorseId, horseName);
  return {
    snapshot: result.dashboard.snapshot,
    error: result.errors?.checks ?? result.errors?.general,
  };
}
