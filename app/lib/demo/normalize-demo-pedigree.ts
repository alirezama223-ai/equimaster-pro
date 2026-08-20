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
  sireId: string | null,
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
  birthYear: number,
  sireId: string | null = null,
  damId: string | null = null
): Promise<HorseResult> {
  const existing = await findHorse(supabase, userId, name, sex);
  if (existing.error) return { id: null, error: existing.error.message };
  if (existing.data?.id) return { id: existing.data.id };

  return createHorse(supabase, userId, name, sex, birthYear, sireId, damId);
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
 * Builds a complete five-generation synthetic pedigree for a demo root.
 *
 * Alpha and Bella share exactly one minimal common branch at generation 4
 * (a controlled 4x4 linebreeding example). The shared ancestor's generation-5
 * parents are also populated so both sides reach 100% pedigree completeness.
 * Other demo stallions receive independent full trees and do not share this
 * synthetic branch with Bella.
 */
async function buildCompletePedigree(
  supabase: SupabaseClient,
  userId: string,
  root: HorseRow,
  options: {
    sharedAncestorId?: string;
    sharedPath?: string;
  }
): Promise<string | undefined> {
  const sharedPath = options.sharedPath ?? "SSSS";
  const sharedAncestorId = options.sharedAncestorId ?? null;

  async function ensureNode(
    nodeId: string,
    nodeName: string,
    nodeSex: "mare" | "stallion",
    birthYear: number,
    generation: number,
    path: string,
    forceShared = false
  ): Promise<string | undefined> {
    if (generation > MAX_GENERATIONS) return undefined;

    let id = nodeId;

    if (forceShared) {
      if (!sharedAncestorId) return "Shared ancestor id is missing.";
      id = sharedAncestorId;
    }

    if (generation === MAX_GENERATIONS) {
      const existing = await findHorse(supabase, userId, nodeName, nodeSex);
      if (existing.error) return existing.error.message;
      if (existing.data?.id) return undefined;

      const created = await createHorse(
        supabase,
        userId,
        nodeName,
        nodeSex,
        birthYear,
        null,
        null
      );
      return created.error;
    }

    const existing = await findHorse(supabase, userId, nodeName, nodeSex);
    if (existing.error) return existing.error.message;
    if (!existing.data?.id) {
      return `Expected demo pedigree node ${nodeName} was not found.`;
    }

    const current = existing.data;
    const childGeneration = generation + 1;
    const childBirthYear = birthYear - 6;
    const sireName = `${nodeName} · Sire G${childGeneration}`;
    const damName = `${nodeName} · Dam G${childGeneration}`;

    const sirePath = `${path}S`;
    const damPath = `${path}D`;
    const sireIsShared = Boolean(
      sharedAncestorId &&
        childGeneration === 4 &&
        sirePath === sharedPath
    );
    const damIsShared = Boolean(
      sharedAncestorId &&
        childGeneration === 4 &&
        damPath === sharedPath
    );

    let sireId: string;
    if (sireIsShared) {
      sireId = sharedAncestorId!;
    } else if (current.sire_id) {
      sireId = current.sire_id;
    } else {
      const created = await getOrCreateHorse(
        supabase,
        userId,
        sireName,
        "stallion",
        childBirthYear
      );
      if (created.error || !created.id) return created.error ?? `Unable to create ${sireName}.`;
      sireId = created.id;
    }

    let damId: string;
    if (damIsShared) {
      damId = sharedAncestorId!;
    } else if (current.dam_id) {
      damId = current.dam_id;
    } else {
      const created = await getOrCreateHorse(
        supabase,
        userId,
        damName,
        "mare",
        childBirthYear + 1
      );
      if (created.error || !created.id) return created.error ?? `Unable to create ${damName}.`;
      damId = created.id;
    }

    const parentError = await setParents(supabase, current.id, sireId, damId);
    if (parentError) return parentError;

    if (sireIsShared || damIsShared) {
      // The shared ancestor itself is populated later by the normal recursive
      // walk from its canonical record, so do not recurse through it twice.
    } else {
      const sireError = await ensureNode(
        sireId,
        sireName,
        "stallion",
        childBirthYear,
        childGeneration,
        sirePath
      );
      if (sireError) return sireError;

      const damError = await ensureNode(
        damId,
        damName,
        "mare",
        childBirthYear + 1,
        childGeneration,
        damPath
      );
      if (damError) return damError;
    }

    return undefined;
  }

  const rootError = await ensureNode(
    root.id,
    root.name,
    root.sex === "mare" ? "mare" : "stallion",
    Number(root.birth_year ?? new Date().getFullYear() - 10),
    0,
    ""
  );
  if (rootError) return rootError;

  return undefined;
}

async function populateSharedAncestor(
  supabase: SupabaseClient,
  userId: string,
  sharedAncestorId: string
): Promise<string | undefined> {
  const { data: shared, error } = await findHorse(
    supabase,
    userId,
    SHARED_ANCESTOR,
    "stallion"
  );
  if (error) return error.message;
  if (!shared?.id || shared.id !== sharedAncestorId) {
    return "The shared demo ancestor could not be resolved.";
  }

  const g5Sire = await getOrCreateHorse(
    supabase,
    userId,
    `${SHARED_ANCESTOR} · Sire G5`,
    "stallion",
    1986
  );
  if (g5Sire.error || !g5Sire.id) return g5Sire.error ?? "Unable to create shared ancestor sire.";

  const g5Dam = await getOrCreateHorse(
    supabase,
    userId,
    `${SHARED_ANCESTOR} · Dam G5`,
    "mare",
    1987
  );
  if (g5Dam.error || !g5Dam.id) return g5Dam.error ?? "Unable to create shared ancestor dam.";

  return setParents(supabase, sharedAncestorId, g5Sire.id, g5Dam.id);
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
 * Upgrades the demo data from shallow/partial ancestry to complete five-
 * generation pedigrees. Bella and Alpha intentionally share one controlled
 * 4x4 ancestor so the matching engine can demonstrate both high confidence
 * and a meaningful linebreeding signal.
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

  const mareError = await buildCompletePedigree(supabase, userId, mareResult.data, {
    sharedAncestorId: shared.id,
    sharedPath: "SSSS",
  });
  if (mareError) return { error: mareError };

  const alphaError = await buildCompletePedigree(supabase, userId, alphaResult.data, {
    sharedAncestorId: shared.id,
    sharedPath: "SSSS",
  });
  if (alphaError) return { error: alphaError };

  for (const name of OTHER_STALLIONS) {
    const result = await resolveRoot(supabase, userId, name, "stallion");
    if (result.error || !result.data) return { error: result.error };

    const error = await buildCompletePedigree(supabase, userId, result.data, {});
    if (error) return { error };
  }

  return {};
}
