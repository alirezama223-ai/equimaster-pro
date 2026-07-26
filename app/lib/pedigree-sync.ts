import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPedigreeInsertRow,
  findConservativePedigreeMatch,
  mapListingGenderToPedigreeSex,
  normalizePedigreeName,
} from "@/app/lib/pedigree";
import { PedigreeSex, PedigreeSubjectInput } from "@/app/types/pedigree";
import { StallionRow } from "@/app/types/stallion";

async function createPedigreeHorse(
  supabase: SupabaseClient,
  userId: string,
  input: {
    name: string;
    sex: PedigreeSex;
    birthYear?: number | null;
    breed?: string | null;
    studbook?: string | null;
    registrationNumber?: string | null;
    color?: string | null;
    country?: string | null;
    sireId?: string | null;
    damId?: string | null;
  }
): Promise<string | null> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return null;
  }

  const { data, error } = await supabase
    .from("pedigree_horses")
    .insert(buildPedigreeInsertRow(input, userId))
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createPedigreeHorse] failed", error);
    return null;
  }

  return data.id as string;
}

async function findOrCreateNamedAncestor(
  supabase: SupabaseClient,
  userId: string,
  input: {
    name: string;
    sex: PedigreeSex;
    birthYear?: number | null;
    studbook?: string | null;
    registrationNumber?: string | null;
  }
): Promise<string | null> {
  const trimmedName = input.name.trim();
  if (!trimmedName || trimmedName === "—") {
    return null;
  }

  const existingId = await findConservativePedigreeMatch(supabase, input);
  if (existingId) {
    return existingId;
  }

  return createPedigreeHorse(supabase, userId, input);
}

async function updatePedigreeRelationsIfAllowed(
  supabase: SupabaseClient,
  horseId: string,
  updates: { sireId?: string | null; damId?: string | null }
) {
  const payload: Record<string, string | null> = {};
  if (updates.sireId !== undefined) payload.sire_id = updates.sireId;
  if (updates.damId !== undefined) payload.dam_id = updates.damId;
  if (Object.keys(payload).length === 0) return;

  await supabase.from("pedigree_horses").update(payload).eq("id", horseId);
}

async function updateSubjectPedigreeIfAllowed(
  supabase: SupabaseClient,
  horseId: string,
  input: PedigreeSubjectInput,
  sireId: string | null,
  damId: string | null
) {
  const payload = {
    name: input.name.trim(),
    normalized_name: normalizePedigreeName(input.name),
    sex: input.sex,
    birth_year: input.birthYear ?? null,
    breed: input.breed?.trim() || null,
    studbook: input.studbook?.trim() || null,
    registration_number: input.registrationNumber?.trim() || null,
    color: input.color?.trim() || null,
    country: input.country?.trim() || null,
    sire_id: sireId,
    dam_id: damId,
  };

  await supabase.from("pedigree_horses").update(payload).eq("id", horseId);
}

export async function syncStructuredPedigree(
  supabase: SupabaseClient,
  userId: string,
  input: PedigreeSubjectInput
): Promise<string | null> {
  const subjectName = input.name.trim();
  if (!subjectName) {
    return input.existingPedigreeHorseId ?? null;
  }

  const sireId = await findOrCreateNamedAncestor(supabase, userId, {
    name: input.sire,
    sex: "stallion",
  });

  const damId = await findOrCreateNamedAncestor(supabase, userId, {
    name: input.dam,
    sex: "mare",
  });

  const damSireId = await findOrCreateNamedAncestor(supabase, userId, {
    name: input.damSire,
    sex: "stallion",
  });

  if (damId && damSireId) {
    await updatePedigreeRelationsIfAllowed(supabase, damId, { sireId: damSireId });
  }

  if (input.existingPedigreeHorseId) {
    await updateSubjectPedigreeIfAllowed(
      supabase,
      input.existingPedigreeHorseId,
      input,
      sireId,
      damId
    );
    return input.existingPedigreeHorseId;
  }

  return createPedigreeHorse(supabase, userId, {
    name: subjectName,
    sex: input.sex,
    birthYear: input.birthYear,
    breed: input.breed,
    studbook: input.studbook,
    registrationNumber: input.registrationNumber,
    color: input.color,
    country: input.country,
    sireId,
    damId,
  });
}

export async function linkListingPedigreeHorse(
  supabase: SupabaseClient,
  listingId: string,
  userId: string,
  pedigreeHorseId: string | null
) {
  if (!pedigreeHorseId) return;

  await supabase
    .from("horse_listings")
    .update({ pedigree_horse_id: pedigreeHorseId })
    .eq("id", listingId)
    .eq("user_id", userId);
}

export async function linkStallionPedigreeHorse(
  supabase: SupabaseClient,
  stallionId: string,
  userId: string,
  pedigreeHorseId: string | null
) {
  if (!pedigreeHorseId) return;

  await supabase
    .from("stallions")
    .update({ pedigree_horse_id: pedigreeHorseId })
    .eq("id", stallionId)
    .eq("owner_id", userId);
}

export async function syncListingPedigreeFromRow(
  supabase: SupabaseClient,
  userId: string,
  row: {
    id: string;
    name: string;
    breed: string;
    gender: string;
    age: number;
    color: string;
    country: string;
    sire: string;
    dam: string;
    dam_sire: string;
    pedigree_horse_id?: string | null;
  }
) {
  const pedigreeHorseId = await syncStructuredPedigree(supabase, userId, {
    name: row.name,
    sex: mapListingGenderToPedigreeSex(row.gender),
    birthYear: new Date().getFullYear() - row.age,
    breed: row.breed,
    color: row.color,
    country: row.country,
    sire: row.sire,
    dam: row.dam,
    damSire: row.dam_sire,
    existingPedigreeHorseId: row.pedigree_horse_id ?? null,
  });

  await linkListingPedigreeHorse(supabase, row.id, userId, pedigreeHorseId);
  return pedigreeHorseId;
}

export async function syncStallionPedigreeFromRow(
  supabase: SupabaseClient,
  userId: string,
  row: StallionRow
) {
  const pedigreeHorseId = await syncStructuredPedigree(supabase, userId, {
    name: row.name,
    sex: "stallion",
    birthYear: row.birth_year,
    breed: row.breed,
    studbook: row.studbook,
    color: row.color,
    country: row.country,
    sire: row.sire,
    dam: row.dam,
    damSire: row.dam_sire,
    existingPedigreeHorseId: row.pedigree_horse_id ?? null,
  });

  await linkStallionPedigreeHorse(supabase, row.id, userId, pedigreeHorseId);
  return pedigreeHorseId;
}
