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
  const { data, error } = await query.limit(1).maybeSingle();
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

async function setParents(
  supabase: SupabaseClient,
  id: string,
  sireId: string | null,
  damId: string | null
): Promise<string | undefined> {
  const { error } = await supabase
    .from("pedigree_horses")
    .update({ sire_id: sireId, dam_id: damId })
    .eq("id", id);
  return error?.message;
}

/**
 * Replaces the intentionally extreme seed relationship with one controlled
 * 3×3 linebreeding example.
 *
 * The important invariant is that the shared ancestor is TERMINAL and both
 * sides have exactly one path to it:
 *
 *   Bella -> Mare G1 -> Mare G2 -> Shared Ancestor
 *   Alpha -> Alpha G1 -> Alpha G2 -> Shared Ancestor
 *
 * No dams are attached to this synthetic branch. This prevents the normal
 * five-generation demo-depth seeder from creating extra common ancestors.
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

  const shared = await getOrCreateHorse(supabase, userId, SHARED_ANCESTOR, "stallion", 1992, null);
  if (shared.error || !shared.id) return { error: shared.error ?? "Unable to create shared demo ancestor." };

  const mareG2 = await getOrCreateHorse(supabase, userId, MARE_G2, "stallion", 1998, shared.id);
  if (mareG2.error || !mareG2.id) return { error: mareG2.error ?? "Unable to create Bella's G2 sire." };

  const mareG1 = await getOrCreateHorse(supabase, userId, MARE_G1, "stallion", 2004, mareG2.id);
  if (mareG1.error || !mareG1.id) return { error: mareG1.error ?? "Unable to create Bella's G1 sire." };

  const alphaG2 = await getOrCreateHorse(supabase, userId, STALLION_G2, "stallion", 1998, shared.id);
  if (alphaG2.error || !alphaG2.id) return { error: alphaG2.error ?? "Unable to create Alpha's G2 sire." };

  const alphaG1 = await getOrCreateHorse(supabase, userId, STALLION_G1, "stallion", 2003, alphaG2.id);
  if (alphaG1.error || !alphaG1.id) return { error: alphaG1.error ?? "Unable to create Alpha's G1 sire." };

  // Reassert the entire controlled branch on every run. This is essential for
  // old demo records that were previously expanded by ensurePedigreeDepth.
  for (const [id, sireId] of [
    [shared.id, null],
    [mareG2.id, shared.id],
    [mareG1.id, mareG2.id],
    [alphaG2.id, shared.id],
    [alphaG1.id, alphaG2.id],
  ] as const) {
    const error = await setParents(supabase, id, sireId, null);
    if (error) return { error };
  }

  // Remove the old synthetic direct/shared branches from the selected roots.
  // The new G1/G2 chain is the only branch that should be visible to analysis.
  const mareErrorMessage = await setParents(supabase, mare.id, mareG1.id, null);
  if (mareErrorMessage) return { error: mareErrorMessage };

  const alphaErrorMessage = await setParents(supabase, alpha.id, alphaG1.id, null);
  if (alphaErrorMessage) return { error: alphaErrorMessage };

  return {};
}
