import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { TRAIT_CATALOG } from "@/app/lib/traits/catalog";

// Keep Demo pedigrees deep enough to exercise ancestor matching without generating
// an unreadable wall of synthetic cards in the Breeding Lab.
const DEMO_DEPTH = 3;
const DEMO_STALLION_PREFIX = "SHABDIZ Demo ";
const MIN_DEMO_ASSESSMENTS_PER_TRAIT = 4;
const DEMO_BASE_SCORES: Record<string, number> = {
  "SHABDIZ Demo Alpha": 5,
  "SHABDIZ Demo Bravo": 4,
  "SHABDIZ Demo Charlie": 3,
  "SHABDIZ Demo Delta": 5,
  "SHABDIZ Demo Echo": 4,
  Bella: 3,
};

type DemoRoot = { id: string; name: string; sex: "mare" | "stallion"; birth_year: number | null; sire_id: string | null; dam_id: string | null };

async function createAncestor(supabase: SupabaseClient, userId: string, name: string, sex: "mare" | "stallion", birthYear: number) {
  const id = randomUUID();
  const { error } = await supabase.from("pedigree_horses").insert({ id, name, normalized_name: name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(), sex, birth_year: birthYear, breed: "Warmblood", color: "Bay", country: "Germany", sire_id: null, dam_id: null, created_by: userId, verified: true });
  return error ? { id: null, error: error.message } : { id };
}

async function ensureDepth(supabase: SupabaseClient, userId: string, rootId: string, depth = DEMO_DEPTH, visited = new Set<string>()): Promise<string | undefined> {
  if (depth <= 0 || visited.has(rootId)) return undefined;
  visited.add(rootId);
  const { data: horse, error } = await supabase.from("pedigree_horses").select("id, name, sex, birth_year, sire_id, dam_id").eq("id", rootId).maybeSingle();
  if (error) return error.message;
  if (!horse) return `Demo pedigree root ${rootId} was not found.`;
  let sireId = horse.sire_id as string | null;
  let damId = horse.dam_id as string | null;
  const baseYear = Number(horse.birth_year ?? new Date().getFullYear()) - 6;
  const baseName = String(horse.name);
  const generation = DEMO_DEPTH - depth + 1;
  if (!sireId) {
    const created = await createAncestor(supabase, userId, `${baseName} · Sire G${generation}`, "stallion", baseYear);
    if (created.error || !created.id) return created.error ?? `Could not create sire for ${baseName}.`;
    sireId = created.id;
    const { error: updateError } = await supabase.from("pedigree_horses").update({ sire_id: sireId }).eq("id", rootId);
    if (updateError) return updateError.message;
  }
  if (!damId) {
    const created = await createAncestor(supabase, userId, `${baseName} · Dam G${generation}`, "mare", baseYear + 1);
    if (created.error || !created.id) return created.error ?? `Could not create dam for ${baseName}.`;
    damId = created.id;
    const { error: updateError } = await supabase.from("pedigree_horses").update({ dam_id: damId }).eq("id", rootId);
    if (updateError) return updateError.message;
  }
  const sireError = await ensureDepth(supabase, userId, sireId, depth - 1, visited);
  if (sireError) return sireError;
  return ensureDepth(supabase, userId, damId, depth - 1, visited);
}

function demoScore(horseName: string, traitIndex: number): number {
  const base = DEMO_BASE_SCORES[horseName] ?? 3;
  return Math.max(1, Math.min(5, base + (((traitIndex + horseName.length) % 3) - 1)));
}

async function ensureTraitEvidence(supabase: SupabaseClient, userId: string, pedigreeHorseId: string, horseName: string) {
  const { data: existing, error: selectError } = await supabase.from("horse_trait_assessments").select("id, trait_key, verified").eq("pedigree_horse_id", pedigreeHorseId);
  if (selectError) return selectError.message;

  // Demo evidence is synthetic test data. Mark it verified so the same public
  // evidence surface used by Breeding Goal Analysis can consume it.
  const existingIds = (existing ?? []).map((row) => row.id).filter(Boolean);
  if (existingIds.length > 0) {
    const { error: verifyError } = await supabase.from("horse_trait_assessments").update({ verified: true }).in("id", existingIds);
    if (verifyError) return verifyError.message;
  }

  const countByTrait = new Map<string, number>();
  for (const row of existing ?? []) countByTrait.set(row.trait_key, (countByTrait.get(row.trait_key) ?? 0) + 1);
  const rows: Record<string, unknown>[] = [];
  for (let traitIndex = 0; traitIndex < TRAIT_CATALOG.length; traitIndex += 1) {
    const trait = TRAIT_CATALOG[traitIndex];
    if (!trait.allowedSourceTypes.includes("owner_reported") && !trait.allowedSourceTypes.includes("breeder_reported")) continue;
    const missing = Math.max(0, MIN_DEMO_ASSESSMENTS_PER_TRAIT - (countByTrait.get(trait.key) ?? 0));
    for (let index = 0; index < missing; index += 1) {
      rows.push({ pedigree_horse_id: pedigreeHorseId, trait_key: trait.key, score: demoScore(horseName, traitIndex), confidence: "high", source_type: index === 0 ? "owner_reported" : "breeder_reported", source_note: "SHABDIZ demo evidence — synthetic test data only.", verified: true, created_by: userId });
    }
  }
  if (rows.length === 0) return undefined;
  const { error } = await supabase.from("horse_trait_assessments").insert(rows);
  return error ? error.message : undefined;
}

export async function repairDemoStallionMatchData(supabase: SupabaseClient, userId: string): Promise<{ error?: string }> {
  const { data: mare, error: mareError } = await supabase.from("pedigree_horses").select("id, name, sex, birth_year, sire_id, dam_id").eq("name", "Bella").eq("sex", "mare").eq("created_by", userId).maybeSingle();
  if (mareError) return { error: mareError.message };
  if (!mare) return { error: "Demo mare Bella was not found." };
  const { data: stallions, error: stallionError } = await supabase.from("stallions").select("pedigree_horse_id, name").eq("owner_id", userId).like("name", `${DEMO_STALLION_PREFIX}%`).not("pedigree_horse_id", "is", null);
  if (stallionError) return { error: stallionError.message };
  const roots: DemoRoot[] = [mare as DemoRoot, ...((stallions ?? []).map((item) => ({ id: item.pedigree_horse_id as string, name: item.name as string, sex: "stallion" as const, birth_year: null, sire_id: null, dam_id: null })) )];
  for (const root of roots) {
    const pedigreeError = await ensureDepth(supabase, userId, root.id);
    if (pedigreeError) return { error: pedigreeError };
    const traitError = await ensureTraitEvidence(supabase, userId, root.id, root.name);
    if (traitError) return { error: traitError };
  }
  return {};
}