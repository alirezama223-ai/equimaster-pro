import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const DEMO_DEPTH = 5;
const DEMO_STALLION_PREFIX = "SHABDIZ Demo ";
const DEMO_TRAITS = {
  "SHABDIZ Demo Alpha": { jumping_scope: 5, jumping_technique: 4, carefulness: 4, rideability: 3, temperament: 3 },
  "SHABDIZ Demo Bravo": { jumping_scope: 4, jumping_technique: 5, carefulness: 5, rideability: 4, temperament: 4 },
  "SHABDIZ Demo Charlie": { jumping_scope: 3, jumping_technique: 4, carefulness: 3, rideability: 5, temperament: 5 },
  "SHABDIZ Demo Delta": { jumping_scope: 5, jumping_technique: 3, carefulness: 4, rideability: 2, temperament: 2 },
  "SHABDIZ Demo Echo": { jumping_scope: 4, jumping_technique: 4, carefulness: 4, rideability: 4, temperament: 5 },
  Bella: { jumping_scope: 3, jumping_technique: 3, carefulness: 3, rideability: 4, temperament: 4 },
} as const;

type DemoRoot = { id: string; name: string; sex: "mare" | "stallion"; birth_year: number | null; sire_id: string | null; dam_id: string | null };

async function createAncestor(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  sex: "mare" | "stallion",
  birthYear: number
) {
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
    sire_id: null,
    dam_id: null,
    created_by: userId,
    verified: true,
  });
  return error ? { id: null, error: error.message } : { id };
}

async function ensureDepth(
  supabase: SupabaseClient,
  userId: string,
  rootId: string,
  depth = DEMO_DEPTH,
  visited = new Set<string>()
): Promise<string | undefined> {
  if (depth <= 0 || visited.has(rootId)) return undefined;
  visited.add(rootId);

  const { data: horse, error } = await supabase
    .from("pedigree_horses")
    .select("id, name, sex, birth_year, sire_id, dam_id")
    .eq("id", rootId)
    .maybeSingle();
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

async function ensureTraitEvidence(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  scores: Record<string, number>
) {
  const { data: existing, error: selectError } = await supabase
    .from("horse_trait_assessments")
    .select("id, trait_key")
    .eq("pedigree_horse_id", pedigreeHorseId);
  if (selectError) return selectError.message;

  const countByTrait = new Map<string, number>();
  for (const row of existing ?? []) countByTrait.set(row.trait_key, (countByTrait.get(row.trait_key) ?? 0) + 1);

  const rows: Record<string, unknown>[] = [];
  for (const [traitKey, score] of Object.entries(scores)) {
    const missing = Math.max(0, 2 - (countByTrait.get(traitKey) ?? 0));
    for (let index = 0; index < missing; index += 1) {
      rows.push({
        pedigree_horse_id: pedigreeHorseId,
        trait_key: traitKey,
        score,
        confidence: "high",
        source_type: index === 0 ? "owner_reported" : "breeder_reported",
        source_note: "SHABDIZ demo evidence — synthetic test data only.",
        verified: false,
        created_by: userId,
      });
    }
  }

  if (rows.length === 0) return undefined;
  const { error } = await supabase.from("horse_trait_assessments").insert(rows);
  return error ? error.message : undefined;
}

export async function repairDemoStallionMatchData(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error?: string }> {
  const { data: mare, error: mareError } = await supabase
    .from("pedigree_horses")
    .select("id, name, sex, birth_year, sire_id, dam_id")
    .eq("name", "Bella")
    .eq("sex", "mare")
    .eq("created_by", userId)
    .maybeSingle();
  if (mareError) return { error: mareError.message };
  if (!mare) return { error: "Demo mare Bella was not found." };

  const { data: stallions, error: stallionError } = await supabase
    .from("stallions")
    .select("pedigree_horse_id, name")
    .eq("owner_id", userId)
    .like("name", `${DEMO_STALLION_PREFIX}%`)
    .not("pedigree_horse_id", "is", null);
  if (stallionError) return { error: stallionError.message };

  const roots: DemoRoot[] = [mare as DemoRoot, ...((stallions ?? []).map((item) => ({
    id: item.pedigree_horse_id as string,
    name: item.name as string,
    sex: "stallion" as const,
    birth_year: null,
    sire_id: null,
    dam_id: null,
  })) )];

  for (const root of roots) {
    const pedigreeError = await ensureDepth(supabase, userId, root.id);
    if (pedigreeError) return { error: pedigreeError };

    const scores = DEMO_TRAITS[root.name as keyof typeof DEMO_TRAITS];
    if (scores) {
      const traitError = await ensureTraitEvidence(supabase, userId, root.id, scores);
      if (traitError) return { error: traitError };
    }
  }

  return {};
}
