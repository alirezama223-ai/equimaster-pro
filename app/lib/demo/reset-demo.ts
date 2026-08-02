import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanupDemoData } from "@/app/lib/demo/cleanup-demo";
import { upsertDemoUserState } from "@/app/lib/demo/preferences";
import { seedDemoEnvironment } from "@/app/lib/demo/seed-demo";

export async function resetDemoEnvironment(
  supabase: SupabaseClient,
  userId: string,
  sellerName: string,
  sellerEmail: string
): Promise<{ error?: string }> {
  const cleanupResult = await cleanupDemoData(supabase, userId);
  if (cleanupResult.error) {
    return cleanupResult;
  }

  const seedResult = await seedDemoEnvironment(supabase, userId, sellerName, sellerEmail);
  if (seedResult.error || !seedResult.result) {
    return { error: seedResult.error ?? "Demo seed failed." };
  }

  return {};
}

export async function setDemoModeEnabled(
  supabase: SupabaseClient,
  userId: string,
  enabled: boolean,
  sellerName: string,
  sellerEmail: string
): Promise<{ error?: string }> {
  const stateUpdate = await upsertDemoUserState(supabase, userId, {
    demoModeEnabled: enabled,
  });

  if (stateUpdate.error) {
    return stateUpdate;
  }

  if (!enabled) {
    return {};
  }

  const { data: stateRow } = await supabase
    .from("demo_user_state")
    .select("demo_seeded")
    .eq("user_id", userId)
    .maybeSingle();

  if (!stateRow?.demo_seeded) {
    return resetDemoEnvironment(supabase, userId, sellerName, sellerEmail);
  }

  return {};
}
