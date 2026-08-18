import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const DEMO_STALLIONS = [
  {
    name: "SHABDIZ Demo Alpha",
    breed: "KWPN",
    studbook: "KWPN",
    birthYear: 2016,
    color: "Bay",
    height: 169,
    country: "Netherlands",
    discipline: "Show Jumping",
    competitionLevel: "1.50m",
    sire: "Demo Sire Alpha",
    dam: "Demo Dam Alpha",
    damSire: "Demo Dam Sire Alpha",
    studFee: 1800,
    emphasis: { jumping_scope: 5, jumping_technique: 4, carefulness: 4, rideability: 3, temperament: 3 },
  },
  {
    name: "SHABDIZ Demo Bravo",
    breed: "Hanoverian",
    studbook: "Hannoveraner",
    birthYear: 2015,
    color: "Dark Bay",
    height: 171,
    country: "Germany",
    discipline: "Show Jumping",
    competitionLevel: "1.45m",
    sire: "Demo Sire Bravo",
    dam: "Demo Dam Bravo",
    damSire: "Demo Dam Sire Bravo",
    studFee: 2200,
    emphasis: { jumping_scope: 4, jumping_technique: 5, carefulness: 5, rideability: 4, temperament: 4 },
  },
  {
    name: "SHABDIZ Demo Charlie",
    breed: "Holsteiner",
    studbook: "Holsteiner",
    birthYear: 2017,
    color: "Grey",
    height: 168,
    country: "Germany",
    discipline: "Show Jumping",
    competitionLevel: "1.40m",
    sire: "Demo Sire Charlie",
    dam: "Demo Dam Charlie",
    damSire: "Demo Dam Sire Charlie",
    studFee: 1500,
    emphasis: { jumping_scope: 3, jumping_technique: 4, carefulness: 3, rideability: 5, temperament: 5 },
  },
  {
    name: "SHABDIZ Demo Delta",
    breed: "Oldenburg",
    studbook: "OS",
    birthYear: 2014,
    color: "Chestnut",
    height: 173,
    country: "Germany",
    discipline: "Show Jumping",
    competitionLevel: "1.50m",
    sire: "Demo Sire Delta",
    dam: "Demo Dam Delta",
    damSire: "Demo Dam Sire Delta",
    studFee: 2600,
    emphasis: { jumping_scope: 5, jumping_technique: 3, carefulness: 4, rideability: 2, temperament: 2 },
  },
  {
    name: "SHABDIZ Demo Echo",
    breed: "BWP",
    studbook: "BWP",
    birthYear: 2018,
    color: "Bay",
    height: 167,
    country: "Belgium",
    discipline: "Show Jumping",
    competitionLevel: "1.35m",
    sire: "Demo Sire Echo",
    dam: "Demo Dam Echo",
    damSire: "Demo Dam Sire Echo",
    studFee: 1200,
    emphasis: { jumping_scope: 4, jumping_technique: 4, carefulness: 4, rideability: 4, temperament: 5 },
  },
] as const;

const DEMO_PEDIGREE_DEPTH = 5;

async function getOrCreateDemoBreeder(supabase: SupabaseClient, userId: string) {
  const { data: existing, error: findError } = await supabase
    .from("breeders")
    .select("id")
    .eq("owner_id", userId)
    .eq("name", "SHABDIZ Demo Stud Farm")
    .eq("status", "active")
    .maybeSingle();

  if (findError) return { id: null, error: findError.message };
  if (existing?.id) return { id: existing.id as string };

  const { data: created, error } = await supabase
    .from("breeders")
    .insert({
      owner_id: userId,
      name: "SHABDIZ Demo Stud Farm",
      slug: `shabdiz-demo-stud-farm-${userId.slice(0, 8)}`,
      description: "Demo breeding farm used exclusively for testing the SHABDIZ stallion matching engine.",
      country: "Germany",
      city: "Aachen",
      email: "demo@shabdizhorse.com",
      phone: "+49 2400 000000",
      disciplines: ["Show Jumping"],
      verified: true,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !created) return { id: null, error: error?.message ?? "Unable to create demo breeder." };
  return { id: created.id as string };
}

async function createPedigreeHorse(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  sex: "stallion" | "mare",
  birthYear: number,
  breed: string,
  color: string,
  country: string,
  sireId: string | null,
  damId: string | null
): Promise<{ id: string | null; error?: string }> {
  const id = randomUUID();
  const { error } = await supabase.from("pedigree_horses").insert({
    id,
    name,
    normalized_name: name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
    sex,
    birth_year: birthYear,
    breed,
    color,
    country,
    sire_id: sireId,
    dam_id: damId,
    created_by: userId,
    verified: true,
  });

  return error ? { id: null, error: error.message } : { id };
}

async function seedTraitEvidence(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  scores: Record<string, number>
) {
  const rows = Object.entries(scores).map(([traitKey, score]) => ({
    pedigree_horse_id: pedigreeHorseId,
    trait_key: traitKey,
    score,
    confidence: "high",
    source_type: "admin_assessed",
    source_note: "SHABDIZ demo evidence — synthetic test data only.",
    verified: true,
    created_by: userId,
  }));

  const { error } = await supabase.from("horse_trait_assessments").insert(rows);
  return error ? error.message : undefined;
}

async function ensureDemoMare(supabase: SupabaseClient, userId: string) {
  const { data: existing, error: findError } = await supabase
    .from("pedigree_horses")
    .select("id, sire_id, dam_id")
    .eq("name", "Bella")
    .eq("sex", "mare")
    .eq("created_by", userId)
    .maybeSingle();

  if (findError) return { id: null, sire_id: null, dam_id: null, error: findError.message };
  if (existing?.id) return { id: existing.id as string, sire_id: existing.sire_id as string | null, dam_id: existing.dam_id as string | null };

  const created = await createPedigreeHorse(
    supabase,
    userId,
    "Bella",
    "mare",
    new Date().getFullYear() - 11,
    "Hanoverian",
    "Black",
    "Germany",
    null,
    null
  );
  if (created.error || !created.id) return { id: null, sire_id: null, dam_id: null, error: created.error ?? "Unable to create demo mare Bella." };

  const traitError = await seedTraitEvidence(supabase, userId, created.id, {
    jumping_scope: 3,
    jumping_technique: 3,
    carefulness: 3,
    rideability: 4,
    temperament: 4,
  });
  if (traitError) return { id: null, sire_id: null, dam_id: null, error: traitError };

  return { id: created.id, sire_id: null, dam_id: null };
}

async function ensurePedigreeDepth(
  supabase: SupabaseClient,
  userId: string,
  rootId: string,
  depth = DEMO_PEDIGREE_DEPTH,
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
  if (!horse) return `Demo pedigree horse ${rootId} was not found.`;

  let sireId = horse.sire_id as string | null;
  let damId = horse.dam_id as string | null;
  const baseYear = Number(horse.birth_year ?? new Date().getFullYear()) - 6;
  const baseName = String(horse.name);

  if (!sireId) {
    const created = await createPedigreeHorse(
      supabase,
      userId,
      `${baseName} · Sire G${DEMO_PEDIGREE_DEPTH - depth + 1}`,
      "stallion",
      baseYear,
      "Warmblood",
      "Bay",
      "Germany",
      null,
      null
    );
    if (created.error || !created.id) return created.error ?? `Unable to create sire for ${baseName}.`;
    sireId = created.id;
  }

  if (!damId) {
    const created = await createPedigreeHorse(
      supabase,
      userId,
      `${baseName} · Dam G${DEMO_PEDIGREE_DEPTH - depth + 1}`,
      "mare",
      baseYear + 1,
      "Warmblood",
      "Bay",
      "Germany",
      null,
      null
    );
    if (created.error || !created.id) return created.error ?? `Unable to create dam for ${baseName}.`;
    damId = created.id;
  }

  const update: Record<string, string> = {};
  if (!horse.sire_id) update.sire_id = sireId;
  if (!horse.dam_id) update.dam_id = damId;
  if (Object.keys(update).length > 0) {
    const { error: updateError } = await supabase.from("pedigree_horses").update(update).eq("id", rootId);
    if (updateError) return updateError.message;
  }

  const sireError = await ensurePedigreeDepth(supabase, userId, sireId, depth - 1, visited);
  if (sireError) return sireError;
  return ensurePedigreeDepth(supabase, userId, damId, depth - 1, visited);
}

export async function seedDemoStallions(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error?: string; marePedigreeId?: string }> {
  const breederResult = await getOrCreateDemoBreeder(supabase, userId);
  if (breederResult.error || !breederResult.id) return { error: breederResult.error };

  const mare = await ensureDemoMare(supabase, userId);
  if (mare.error || !mare.id) return { error: mare.error ?? "Demo mare Bella is unavailable." };

  let sharedSireId = mare.sire_id;
  if (!sharedSireId) {
    const sharedSire = await createPedigreeHorse(
      supabase,
      userId,
      "SHABDIZ Demo Common Sire",
      "stallion",
      2008,
      "Warmblood",
      "Bay",
      "Germany",
      null,
      null
    );
    if (sharedSire.error || !sharedSire.id) return { error: sharedSire.error };
    sharedSireId = sharedSire.id;
    const { error } = await supabase.from("pedigree_horses").update({ sire_id: sharedSireId }).eq("id", mare.id);
    if (error) return { error: error.message };
  }

  const demoRootIds: string[] = [mare.id];

  for (let index = 0; index < DEMO_STALLIONS.length; index += 1) {
    const template = DEMO_STALLIONS[index];
    const { data: existing } = await supabase
      .from("stallions")
      .select("id, pedigree_horse_id")
      .eq("owner_id", userId)
      .eq("name", template.name)
      .maybeSingle();

    if (existing?.id && existing.pedigree_horse_id) {
      demoRootIds.push(existing.pedigree_horse_id as string);
      continue;
    }

    const sireId = index === 0 ? sharedSireId : null;
    const sire = await createPedigreeHorse(
      supabase,
      userId,
      template.sire,
      "stallion",
      template.birthYear - 7,
      template.breed,
      "Bay",
      template.country,
      null,
      null
    );
    if (sire.error || !sire.id) return { error: sire.error };

    const dam = await createPedigreeHorse(
      supabase,
      userId,
      template.dam,
      "mare",
      template.birthYear - 6,
      template.breed,
      "Bay",
      template.country,
      null,
      null
    );
    if (dam.error || !dam.id) return { error: dam.error };

    const subject = await createPedigreeHorse(
      supabase,
      userId,
      template.name,
      "stallion",
      template.birthYear,
      template.breed,
      template.color,
      template.country,
      sireId ?? sire.id,
      dam.id
    );
    if (subject.error || !subject.id) return { error: subject.error };

    const { error: stallionError } = await supabase.from("stallions").insert({
      owner_id: userId,
      breeder_id: breederResult.id,
      name: template.name,
      breed: template.breed,
      studbook: template.studbook,
      birth_year: template.birthYear,
      color: template.color,
      height: template.height,
      country: template.country,
      discipline: template.discipline,
      competition_level: template.competitionLevel,
      sire: template.sire,
      dam: template.dam,
      dam_sire: template.damSire,
      stud_fee: template.studFee,
      stud_fee_currency: "EUR",
      availability: "available",
      breeding_methods: ["fresh_semen", "chilled_semen", "frozen_semen"],
      description: "SHABDIZ demo stallion — test data only.",
      performance: "Synthetic performance profile for testing the matching engine.",
      breeding_highlights: "Synthetic trait profile for testing goal alignment.",
      image_urls: [],
      cover_image_url: null,
      verified: true,
      status: "active",
      pedigree_horse_id: subject.id,
    });

    if (stallionError) return { error: stallionError.message };

    const traitError = await seedTraitEvidence(supabase, userId, subject.id, template.emphasis);
    if (traitError) return { error: traitError };
    demoRootIds.push(subject.id);
  }

  // Make the demo ancestry deep enough for the same evidence-confidence rules
  // used in production, rather than weakening the production scoring gate.
  for (const rootId of demoRootIds) {
    const error = await ensurePedigreeDepth(supabase, userId, rootId);
    if (error) return { error };
  }

  return { marePedigreeId: mare.id };
}
