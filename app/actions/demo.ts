"use server";

import { fetchDemoEnvironmentSnapshot } from "@/app/lib/demo/queries";
import { resetDemoEnvironment, setDemoModeEnabled } from "@/app/lib/demo/reset-demo";
import { normalizeDemoPedigree } from "@/app/lib/demo/normalize-demo-pedigree";
import { repairDemoStallionMatchData } from "@/app/lib/demo/repair-demo-stallion-match";
import { seedDemoStallions } from "@/app/lib/demo/seed-demo-stallions";
import { TRAIT_CATALOG } from "@/app/lib/traits/catalog";
import { createClient } from "@/app/lib/supabase/server";
import { requireAdmin } from "@/app/lib/admin";
import type { DemoEnvironmentSnapshot } from "@/app/types/demo";

const DEMO_BASE_SCORES: Record<string, number> = {
  Bella: 3,
  "SHABDIZ Demo Alpha": 5,
  "SHABDIZ Demo Bravo": 4,
  "SHABDIZ Demo Charlie": 3,
  "SHABDIZ Demo Delta": 5,
  "SHABDIZ Demo Echo": 4,
};

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

function demoScore(horseName: string, traitIndex: number): number {
  const base = DEMO_BASE_SCORES[horseName] ?? 3;
  return Math.max(1, Math.min(5, base + (((traitIndex + horseName.length) % 3) - 1)));
}

async function ensureVerifiedDemoTraitCoverage(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | undefined> {
  const { data: horses, error: horseError } = await supabase
    .from("pedigree_horses")
    .select("id, name")
    .eq("created_by", userId)
    .or("name.eq.Bella,name.like.SHABDIZ Demo %");
  if (horseError) return horseError.message;

  for (const horse of horses ?? []) {
    const horseName = String(horse.name);
    if (!DEMO_BASE_SCORES[horseName]) continue;

    const { data: existing, error: existingError } = await supabase
      .from("horse_trait_assessments")
      .select("id, trait_key")
      .eq("pedigree_horse_id", horse.id);
    if (existingError) return existingError.message;

    const existingIds = (existing ?? []).map((row) => row.id).filter(Boolean);
    if (existingIds.length > 0) {
      const { error: verifyError } = await supabase
        .from("horse_trait_assessments")
        .update({ verified: true })
        .in("id", existingIds);
      if (verifyError) return verifyError.message;
    }

    const countByTrait = new Map<string, number>();
    for (const row of existing ?? []) {
      countByTrait.set(row.trait_key, (countByTrait.get(row.trait_key) ?? 0) + 1);
    }

    const rows: Record<string, unknown>[] = [];
    for (let traitIndex = 0; traitIndex < TRAIT_CATALOG.length; traitIndex += 1) {
      const trait = TRAIT_CATALOG[traitIndex];
      // Demo/Test Mode supplies only reported/assessable traits. Breeding/commercial
      // evidence remains absent unless it is supported by real verified records.
      if (!trait.allowedSourceTypes.includes("owner_reported") && !trait.allowedSourceTypes.includes("breeder_reported")) continue;
      const missing = Math.max(0, 2 - (countByTrait.get(trait.key) ?? 0));
      for (let index = 0; index < missing; index += 1) {
        rows.push({
          pedigree_horse_id: horse.id,
          trait_key: trait.key,
          score: demoScore(horseName, traitIndex),
          confidence: "high",
          source_type: "admin_assessed",
          source_note: "SHABDIZ demo evidence — synthetic test data only.",
          verified: true,
          created_by: userId,
        });
      }
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("horse_trait_assessments").insert(rows);
      if (insertError) return insertError.message;
    }
  }

  return undefined;
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

/** Enables the demo environment, seeds five isolated SHABDIZ demo stallions, and repairs any older shallow demo records. */
export async function seedDemoStallionMatch(): Promise<{ error?: string; marePedigreeId?: string }> {
  const admin = await requireAdmin();
  if (admin.error || !admin.supabase || !admin.user) {
    return { error: admin.error ?? "Admin access required to load SHABDIZ demo data." };
  }

  const { sellerName, sellerEmail } = sellerDetails(admin.user);
  const demoModeResult = await setDemoModeEnabled(
    admin.supabase,
    admin.user.id,
    true,
    sellerName,
    sellerEmail
  );
  if (demoModeResult.error) return { error: demoModeResult.error };

  const seedResult = await seedDemoStallions(admin.supabase, admin.user.id);
  if (seedResult.error) return seedResult;

  const pedigreeResult = await normalizeDemoPedigree(admin.supabase, admin.user.id);
  if (pedigreeResult.error) return { error: pedigreeResult.error, marePedigreeId: seedResult.marePedigreeId };

  const repairResult = await repairDemoStallionMatchData(admin.supabase, admin.user.id);
  if (repairResult.error) return { error: repairResult.error, marePedigreeId: seedResult.marePedigreeId };

  const traitRepairError = await ensureVerifiedDemoTraitCoverage(admin.supabase, admin.user.id);
  if (traitRepairError) return { error: traitRepairError, marePedigreeId: seedResult.marePedigreeId };

  return seedResult;
}
