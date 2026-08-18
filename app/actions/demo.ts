"use server";

import { fetchDemoEnvironmentSnapshot } from "@/app/lib/demo/queries";
import { resetDemoEnvironment, setDemoModeEnabled } from "@/app/lib/demo/reset-demo";
import { seedDemoStallions } from "@/app/lib/demo/seed-demo-stallions";
import { createClient } from "@/app/lib/supabase/server";
import type { DemoEnvironmentSnapshot } from "@/app/types/demo";

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return { supabase, user: null, error: error.message };
  if (!user) return { supabase, user: null, error: "You must be signed in to manage the demo environment." };
  return { supabase, user, error: undefined };
}

function sellerDetails(user: NonNullable<Awaited<ReturnType<typeof requireAuthenticatedUser>>["user"]>) {
  return {
    sellerName: (user.user_metadata?.full_name as string | undefined)?.trim() || "EquiMaster Demo User",
    sellerEmail: user.email ?? "demo@equimaster.pro",
  };
}

export async function getDemoEnvironmentSnapshot(): Promise<{ snapshot: DemoEnvironmentSnapshot | null; error?: string }> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return { snapshot: null, error: auth.error };
  return fetchDemoEnvironmentSnapshot(auth.supabase, auth.user.id);
}

export async function setDemoMode(enabled: boolean): Promise<{ error?: string }> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return { error: auth.error };
  const { sellerName, sellerEmail } = sellerDetails(auth.user);
  return setDemoModeEnabled(auth.supabase, auth.user.id, enabled, sellerName, sellerEmail);
}

export async function resetDemo(): Promise<{ error?: string }> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return { error: auth.error };
  const { sellerName, sellerEmail } = sellerDetails(auth.user);
  return resetDemoEnvironment(auth.supabase, auth.user.id, sellerName, sellerEmail);
}

/** Enables the demo environment when needed, then creates five isolated SHABDIZ demo stallions for testing Stallion Match. */
export async function seedDemoStallionMatch(): Promise<{ error?: string; marePedigreeId?: string }> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return { error: auth.error };

  const { sellerName, sellerEmail } = sellerDetails(auth.user);
  const demoModeResult = await setDemoModeEnabled(
    auth.supabase,
    auth.user.id,
    true,
    sellerName,
    sellerEmail
  );
  if (demoModeResult.error) return { error: demoModeResult.error };

  return seedDemoStallions(auth.supabase, auth.user.id);
}
