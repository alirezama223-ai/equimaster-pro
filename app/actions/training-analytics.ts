"use server";

import { canManageTraitAssessments } from "@/app/lib/traits/access";
import { fetchHorseTrainingAnalytics } from "@/app/lib/training/horse-analytics";
import { fetchManageableTrainingHorses } from "@/app/lib/training/queries";
import { createClient } from "@/app/lib/supabase/server";
import type {
  HorseTrainingAnalytics,
  HorseTrainingAnalyticsErrors,
} from "@/app/types/training-analytics";
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
    return { supabase, user: null, error: "You must be signed in to view analytics." };
  }

  return { supabase, user, error: undefined };
}

export async function getTrainingAnalyticsHorses(): Promise<{
  horses: TrainingHorse[];
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { horses: [], error: auth.error };
  }

  return fetchManageableTrainingHorses(auth.supabase, auth.user.id);
}

export async function getHorseTrainingAnalytics(pedigreeHorseId: string): Promise<{
  analytics: HorseTrainingAnalytics | null;
  horseName?: string;
  errors?: HorseTrainingAnalyticsErrors;
  error?: string;
}> {
  if (!isUuid(pedigreeHorseId)) {
    return { analytics: null, error: "Invalid horse selection." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { analytics: null, error: auth.error };
  }

  const canManage = await canManageTraitAssessments(auth.supabase, pedigreeHorseId, auth.user.id);
  if (!canManage) {
    return { analytics: null, error: "You do not have access to this horse." };
  }

  const horsesResult = await fetchManageableTrainingHorses(auth.supabase, auth.user.id);
  const horseName =
    horsesResult.horses.find((horse) => horse.id === pedigreeHorseId)?.name ?? "Unknown horse";

  const result = await fetchHorseTrainingAnalytics(
    auth.supabase,
    auth.user.id,
    pedigreeHorseId,
    horseName
  );

  return {
    analytics: result.analytics,
    horseName,
    errors: result.errors,
  };
}
