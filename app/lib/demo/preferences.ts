import type { SupabaseClient } from "@supabase/supabase-js";
import type { DemoUserState } from "@/app/types/demo";

type DemoUserStateRow = {
  demo_mode_enabled: boolean;
  demo_seeded: boolean;
  demo_horse_ids: string[] | null;
  demo_listing_ids: string[] | null;
  demo_plan_ids: string[] | null;
  primary_demo_horse_id: string | null;
  last_reset_at: string | null;
};

function mapDemoUserState(row: DemoUserStateRow | null): DemoUserState {
  return {
    demoModeEnabled: row?.demo_mode_enabled ?? false,
    demoSeeded: row?.demo_seeded ?? false,
    demoHorseIds: row?.demo_horse_ids ?? [],
    primaryDemoHorseId: row?.primary_demo_horse_id ?? null,
    lastResetAt: row?.last_reset_at ?? null,
  };
}

export async function fetchDemoUserState(
  supabase: SupabaseClient,
  userId: string
): Promise<{ state: DemoUserState; error?: string }> {
  const { data, error } = await supabase
    .from("demo_user_state")
    .select(
      "demo_mode_enabled, demo_seeded, demo_horse_ids, demo_listing_ids, demo_plan_ids, primary_demo_horse_id, last_reset_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { state: mapDemoUserState(null), error: error.message };
  }

  return { state: mapDemoUserState(data as DemoUserStateRow | null) };
}

export async function fetchDemoHorseFilter(
  supabase: SupabaseClient,
  userId: string
): Promise<{ demoModeEnabled: boolean; demoHorseIds: Set<string> }> {
  const { state } = await fetchDemoUserState(supabase, userId);
  return {
    demoModeEnabled: state.demoModeEnabled,
    demoHorseIds: new Set(state.demoHorseIds),
  };
}

export async function upsertDemoUserState(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<{
    demoModeEnabled: boolean;
    demoSeeded: boolean;
    demoHorseIds: string[];
    demoListingIds: string[];
    demoPlanIds: string[];
    primaryDemoHorseId: string | null;
    lastResetAt: string | null;
  }>
): Promise<{ error?: string }> {
  const payload: Record<string, unknown> = { user_id: userId };

  if (patch.demoModeEnabled !== undefined) {
    payload.demo_mode_enabled = patch.demoModeEnabled;
  }
  if (patch.demoSeeded !== undefined) {
    payload.demo_seeded = patch.demoSeeded;
  }
  if (patch.demoHorseIds !== undefined) {
    payload.demo_horse_ids = patch.demoHorseIds;
  }
  if (patch.demoListingIds !== undefined) {
    payload.demo_listing_ids = patch.demoListingIds;
  }
  if (patch.demoPlanIds !== undefined) {
    payload.demo_plan_ids = patch.demoPlanIds;
  }
  if (patch.primaryDemoHorseId !== undefined) {
    payload.primary_demo_horse_id = patch.primaryDemoHorseId;
  }
  if (patch.lastResetAt !== undefined) {
    payload.last_reset_at = patch.lastResetAt;
  }

  const { error } = await supabase.from("demo_user_state").upsert(payload, { onConflict: "user_id" });

  return error ? { error: error.message } : {};
}
