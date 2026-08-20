import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const MAX_GENERATIONS = 5;
const SHARED_ANCESTOR = "SHABDIZ Demo Linebreeding Ancestor G4";
const BELLA_NAME = "Bella";
const ALPHA_NAME = "SHABDIZ Demo Alpha";
const OTHER_STALLIONS = [
  "SHABDIZ Demo Bravo",
  "SHABDIZ Demo Charlie",
  "SHABDIZ Demo Delta",
  "SHABDIZ Demo Echo",
] as const;

type HorseResult = { id: string | null; error?: string };

type HorseRow = {
  id: string;
  name: string;
  sex: "mare" | "stallion" | "unknown";
  birth_year: number | null;
  sire_id: string | null;
  dam_id: string | null;
};

async function findHorse(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  sex?: "mare" | "stallion"
) {
  let query = supabase
    .from("pedigree_horses")
    .select("id, name, sex, birth_year, sire_id, dam_id")
    .eq("name", name)
    .eq("created_by", userId);

  if (sex) query = query.eq("sex", sex);

  const { data, error } = await query.limit(1).maybeSingle();
  return { data: data as HorseRow | null, error };
}

async function createHorse(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  sex: "mare" | "stallion",
  birthYear: number,
  sireId: string | null = null,
  damId: string | null = null
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
    dam_id: damId,
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
  birthYear: number
): Promise<HorseResult> {
  const existing = await findHorse(supabase, userId, name, sex);
  if (existing.error) return { id: null, error: existing.error.message };
  if (existing.data?.id) return { id: existing.data.id };

  return createHorse(supabase, userId, name, sex, birthYear);
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

async function resolveRoot(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  sex: "mare" | "stallion"
): Promise<{ data: HorseRow | null; error?: string }> {
  const result = await findHorse(supabase, userId, name, sex);
  if (result.error) return { data: null, error: result.error.message };
  if (!result.data) return { data: null, error: `Demo pedigree horse ${name} was not found.` };
  return { data: result.data };
}

/**
 * Builds a deterministic complete five-generation pedigree.
 *
 * Bella and Alpha intentionally share exactly one controlled branch at 4x4:
 * both have the same G4 sire. All other branches are independent. Existing
 * shallow demo parents are deliberately overwritten so old seed data cannot
 * leak extra common ancestors into the analysis.
 */
async function buildCompletePedigree(
  supabase: SupabaseClient,
  userId: string,
  root: HorseRow,
  sharedAncestorId?: string
): Promise<string | undefined> {
  async function ensureNode(
    id: string,
    name: string,
    sex: "mare" | "stallion",
    birthYear: number,
    generation: number,
    path: string
  ): Promise<string | undefined> {
    if (generation >= MAX_GENERATIONS) {
      const sire = await getOrCreateHorse(
        supabase,
        userId,
        `${name} · Sire G${generation + 1}`,
        "stallion",
        birthYear - 6
      );
      if (sire.error || !sire.id) return sire.error ?? `Unable to create sire for ${name}.`;
      const dam = await getOrCreateHorse(
        supabase,
        userId,
        `${name} · Dam G${generation + 1}`,
        "mare",
        birthYear - 5
      );
      if (dam.error || !dam.id) return dam.error ?? `Unable to create dam for ${name}.`;
      // Generation 5 is a terminal ancestor: it must have no children in the
      // analyzed five-generation graph, so stop here.
      return undefined;
    }

    const nextGeneration = generation + 1;
    const parentYear = birthYear - 6;
    const sirePath = `${path}S`;
    const damPath = `${path}D`;

    let sireId: string | null = null;
    let damId: string | null = null;

    if (nextGeneration === 4 && sirePath === "SSSS" && sharedAncestorId) {
      sireId = sharedAncestorId;
    } else {
      const sire = await getOrCreateHorse(
        supabase,
        userId,
        `${name} · Sire G${nextGeneration}`,
        "stallion",
        parentYear
      );
      if (sire.error || !sire.id) return sire.error ?? `Unable to create sire for ${name}.`;
      sireId = sire.id;
    }

    if (nextGeneration === 4 && damPath === "SSSS" && sharedAncestorId) {
      damId = sharedAncestorId;
    } else {
      const dam = await getOrCreateHorse(
        supabase,
        userId,
        `${name} · Dam G${nextGeneration}`,
        "mare",
        parentYear + 1
      );
      if (dam.error || !dam.id) return dam.error ?? `Unable to create dam for ${name}.`;
      damId = dam.id;
    }

    // Always replace the parent links. This removes stale shallow/shared
    // branches created by previous versions of the demo seeder.
    const parentError = await setParents(supabase, id, sireId, damId);
    if (parentError) return parentError;

    if (!(nextGeneration === 4 && sirePath === "SSSS" && sharedAncestorId)) {
      const error = await ensureNode(
        sireId,
        `${name} · Sire G${nextGeneration}`,
        "stallion",
        parentYear,
        nextGeneration,
        sirePath
      );
      if (error) return error;
    }

    if (!(nextGeneration === 4 && damPath === "SSSS" && sharedAncestorId)) {
      const error = await ensureNode(
        damId,
        `${name} · Dam G${nextGeneration}`,
        "mare",
        parentYear + 1,
        nextGeneration,
        damPath
      );
      if (error) return error;
    }

    return undefined;
  }

  return ensureNode(
    root.id,
    root.name,
    root.sex === "mare" ? "mare" : "stallion",
    Number(root.birth_year ?? new Date().getFullYear() - 10),
    0,
    ""
  );
}

async function populateSharedAncestor(
  supabase: SupabaseClient,
  userId: string,
  sharedAncestorId: string
): Promise<string | undefined> {
  const sire = await getOrCreateHorse(
    supabase,
    userId,
    `${SHARED_ANCESTOR} · Sire G5`,
    "stallion",
    1986
  );
  if (sire.error || !sire.id) return sire.error ?? "Unable to create shared ancestor sire.";

  const dam = await getOrCreateHorse(
    supabase,
    userId,
    `${SHARED_ANCESTOR} · Dam G5`,
    "mare",
    1987
  );
  if (dam.error || !dam.id) return dam.error ?? "Unable to create shared ancestor dam.";

  return setParents(supabase, sharedAncestorId, sire.id, dam.id);
}

/**
 * Upgrades the demo data to complete five-generation pedigrees. Bella and
 * Alpha have one controlled 4x4 shared ancestor; Bravo/Charlie/Delta/Echo are
 * independent complete trees. The matching engine can therefore test both
 * evidence confidence and a real linebreeding signal.
 */
export async function normalizeDemoPedigree(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error?: string }> {
  const mareResult = await resolveRoot(supabase, userId, BELLA_NAME, "mare");
  if (mareResult.error || !mareResult.data) return { error: mareResult.error };

  const alphaResult = await resolveRoot(supabase, userId, ALPHA_NAME, "stallion");
  if (alphaResult.error || !alphaResult.data) return { error: alphaResult.error };

  const shared = await getOrCreateHorse(
    supabase,
    userId,
    SHARED_ANCESTOR,
    "stallion",
    1992
  );
  if (shared.error || !shared.id) {
    return { error: shared.error ?? "Unable to create shared demo ancestor." };
  }

  const sharedParentError = await populateSharedAncestor(
    supabase,
    userId,
    shared.id
  );
  if (sharedParentError) return { error: sharedParentError };

  const mareError = await buildCompletePedigree(
    supabase,
    userId,
    mareResult.data,
    shared.id
  );
  if (mareError) return { error: mareError };

  const alphaError = await buildCompletePedigree(
    supabase,
    userId,
    alphaResult.data,
    shared.id
  );
  if (alphaError) return { error: alphaError };

  for (const name of OTHER_STALLIONS) {
    const result = await resolveRoot(supabase, userId, name, "stallion");
    if (result.error || !result.data) return { error: result.error };

    const error = await buildCompletePedigree(supabase, userId, result.data);
    if (error) return { error };
  }

  return {};
}
