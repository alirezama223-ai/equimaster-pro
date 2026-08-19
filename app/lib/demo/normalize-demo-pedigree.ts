import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SHARED_ANCESTOR = "SHABDIZ Demo Linebreeding Ancestor G3";
const MARE_G2 = "SHABDIZ Demo Bella Line G2";
const MARE_G1 = "SHABDIZ Demo Bella Line G1";
const STALLION_G2 = "SHABDIZ Demo Alpha Line G2";
const STALLION_G1 = "SHABDIZ Demo Alpha Line G1";

type HorseResult = { id: string | null; error?: string };

async function findHorse(supabase: SupabaseClient, userId: string, name: string, sex?: "mare" | "stallion") {
  let query = supabase
    .from("pedigree_horses")
    .select("id, name, sex, birth_year, sire_id, dam_id")
    .eq("name", name)
    .eq("created_by", userId);
  if (sex) query = query.eq("sex", sex);
  const { data, error } = await query.maybeSingle();
  return { data, error };
}

async function createHorse(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  sex: "mare" | "stallion",
  birthYear: number,
  sireId: string | null
): Promise<HorseResult> {
  const id = randomUUID();
  const { error } = await supabase.from("pedigree_horses").insert({
    id,
    name,
    normalized_name: name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
    sex,
    birth_year: birthYear,
    breed: "Warmblood",
    color: "Bay",
    country: "Germany",
    sire_id: sireId,
    dam_id: null,
    created_by: userId,
    verified: true,
  });
  return error ? { id: null, error: error.message } : { id };
}

async function getOrCreateHorse(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  sex: "mare" | "stallion",
  birthYear: number,
  sireId: string | null
): Promise<HorseResult> {
  const existing = await findHorse(supabase, userId, name, sex);
  if (existing.error) return { id: null, error: existing.error.message };
  if (existing.data?.id) return { id: existing.data.id as string };
  return createHorse(supabase, userId, name, sex, birthYear, sireId);
}

/**
 * Replaces the intentionally extreme seed relationship (direct shared sire)
 * with a controlled 3×3 linebreeding example. The demo still exercises the
 * common-ancestor and linebreeding logic, but no longer creates 1×1 or 2×2
 * patterns merely because the synthetic tree generator expands the same node.
 *
 * The shared ancestor is deliberately terminal: it must have no parents of
 * its own. Otherwise the demo depth seeder expands those parents and every
 * ancestor above the shared node becomes common to both sides as well.
 */
export async function normalizeDemoPedigree(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error?: string }> {
  const { data: mare, error: mareError } = await findHorse(supabase, userId, "Bella", "mare");
  if (mareError) return { error: mareError.message };
  if (!mare?.id) return { error: "Demo mare Bella was not found." };

  const { data: alpha, error: alphaError } = await findHorse(
    supabase,
    userId,
    "SHABDIZ Demo Alpha",
    "stallion"
  );
  if (alphaError) return { error: alphaError.message };
  if (!alpha?.id) return { error: "Demo stallion SHABDIZ Demo Alpha was not found." };

  const { data: existingShared } = await findHorse(supabase, userId, SHARED_ANCESTOR, "stallion");
  if (existingShared?.id && (existingShared.sire_id !== null || existingShared.dam_id !== null)) {
    const { error } = await supabase
      .from("pedigree_horses")
      .update({ sire_id: null, dam_id: null })
      .eq("id", existingShared.id);
    if (error) return { error: error.message };
  }

  const { data: existingMareG1 } = await findHorse(supabase, userId, MARE_G1, "stallion");
  const { data: existingAlphaG1 } = await findHorse(supabase, userId, STALLION_G1, "stallion");

  if (existingMareG1?.id && existingAlphaG1?.id) {
    const mareNeedsUpdate = mare.sire_id !== existingMareG1.id;
    const alphaNeedsUpdate = alpha.sire_id !== existingAlphaG1.id;
    if (mareNeedsUpdate || alphaNeedsUpdate) {
      if (mareNeedsUpdate) {
        const { error } = await supabase
          .from("pedigree_horses")
          .update({ sire_id: existingMareG1.id })
          .eq("id", mare.id);
        if (error) return { error: error.message };
      }
      if (alphaNeedsUpdate) {
        const { error } = await supabase
          .from("pedigree_horses")
          .update({ sire_id: existingAlphaG1.id })
          .eq("id", alpha.id);
        if (error) return { error: error.message };
      }
    }
    return {};
  }

  const shared = await getOrCreateHorse(supabase, userId, SHARED_ANCESTOR, "stallion", 1992, null);
  if (shared.error || !shared.id) return { error: shared.error ?? "Unable to create shared demo ancestor." };

  // Never allow the shared 3×3 ancestor to inherit a synthetic parent tree.
  // That would turn one intended common ancestor into dozens of common
  // ancestors when the normal 5-generation demo expansion runs.
  const { error: sharedResetError } = await supabase
    .from("pedigree_horses")
    .update({ sire_id: null, dam_id: null })
    .eq("id", shared.id);
  if (sharedResetError) return { error: sharedResetError.message };

  const mareG2 = await getOrCreateHorse(supabase, userId, MARE_G2, "stallion", 1998, shared.id);
  if (mareG2.error || !mareG2.id) return { error: mareG2.error ?? "Unable to create Bella's G2 sire." };

  const mareG1 = await getOrCreateHorse(supabase, userId, MARE_G1, "stallion", 2004, mareG2.id);
  if (mareG1.error || !mareG1.id) return { error: mareG1.error ?? "Unable to create Bella's G1 sire." };

  const alphaG2 = await getOrCreateHorse(supabase, userId, STALLION_G2, "stallion", 1998, shared.id);
  if (alphaG2.error || !alphaG2.id) return { error: alphaG2.error ?? "Unable to create Alpha's G2 sire." };

  const alphaG1 = await getOrCreateHorse(supabase, userId, STALLION_G1, "stallion", 2003, alphaG2.id);
  if (alphaG1.error || !alphaG1.id) return { error: alphaG1.error ?? "Unable to create Alpha's G1 sire." };

  const { error: mareUpdateError } = await supabase
    .from("pedigree_horses")
    .update({ sire_id: mareG1.id })
    .eq("id", mare.id);
  if (mareUpdateError) return { error: mareUpdateError.message };

  const { error: alphaUpdateError } = await supabase
    .from("pedigree_horses")
    .update({ sire_id: alphaG1.id })
    .eq("id", alpha.id);
  if (alphaUpdateError) return { error: alphaUpdateError.message };

  return {};
}
