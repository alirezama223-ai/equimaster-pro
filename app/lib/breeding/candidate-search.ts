import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureListingPedigreeHorseId,
  ensureStallionPedigreeHorseId,
} from "@/app/lib/pedigree-backfill";
import { estimateBirthYearFromAge, rowToPedigreeHorse } from "@/app/lib/pedigree";
import { syncListingPedigreeFromRow } from "@/app/lib/pedigree-sync";
import { BreedingCandidate } from "@/app/types/breeding";
import { HorseListingRow } from "@/app/types/horse-listing";

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_,]/g, "");
}

export async function enrichCandidatesWithPedigreeMetadata(
  supabase: SupabaseClient,
  candidates: BreedingCandidate[]
): Promise<BreedingCandidate[]> {
  const pedigreeIds = candidates.map((candidate) => candidate.id);
  if (pedigreeIds.length === 0) return candidates;

  const { data: pedigreeRows } = await supabase
    .from("pedigree_horses")
    .select("id, name, sex, birth_year, studbook, registration_number, verified, sire_id, dam_id")
    .in("id", pedigreeIds);

  const pedigreeMap = new Map<string, ReturnType<typeof rowToPedigreeHorse>>();
  for (const row of pedigreeRows ?? []) {
    pedigreeMap.set(String(row.id), rowToPedigreeHorse(row as Record<string, unknown>));
  }

  const relatedIds = [
    ...(pedigreeRows ?? []).map((row) => row.sire_id).filter(Boolean),
    ...(pedigreeRows ?? []).map((row) => row.dam_id).filter(Boolean),
  ] as string[];

  const relatedNames = new Map<string, string>();
  if (relatedIds.length > 0) {
    const { data: relatedRows } = await supabase
      .from("pedigree_horses")
      .select("id, name, sire_id")
      .in("id", [...new Set(relatedIds)]);

    for (const related of relatedRows ?? []) {
      relatedNames.set(related.id as string, related.name as string);
    }
  }

  const damIds = (pedigreeRows ?? []).map((row) => row.dam_id).filter(Boolean) as string[];
  const damSireMap = new Map<string, string | null>();
  if (damIds.length > 0) {
    const { data: damRows } = await supabase
      .from("pedigree_horses")
      .select("id, sire_id")
      .in("id", [...new Set(damIds)]);

    for (const damRow of damRows ?? []) {
      const damSireId = damRow.sire_id as string | null;
      damSireMap.set(damRow.id as string, damSireId ? relatedNames.get(damSireId) ?? null : null);
    }
  }

  return candidates.map((candidate) => {
    const horse = pedigreeMap.get(candidate.id);
    if (!horse) return candidate;

    return {
      ...candidate,
      name: horse.name,
      sex: horse.sex,
      birthYear: candidate.birthYear ?? horse.birthYear,
      studbook: candidate.studbook ?? horse.studbook,
      registrationNumber: horse.registrationNumber,
      sireName: candidate.sireName ?? (horse.sireId ? relatedNames.get(horse.sireId) ?? null : null),
      damSireName:
        candidate.damSireName ?? (horse.damId ? damSireMap.get(horse.damId) ?? null : null),
      verified: horse.verified,
    };
  });
}

async function resolveListingPedigreeId(
  supabase: SupabaseClient,
  listing: HorseListingRow,
  userId: string | null
): Promise<string | null> {
  if (listing.pedigree_horse_id) {
    return listing.pedigree_horse_id;
  }

  const rpcId = await ensureListingPedigreeHorseId(supabase, listing.id);
  if (rpcId) {
    return rpcId;
  }

  if (userId && userId === listing.user_id) {
    return syncListingPedigreeFromRow(supabase, userId, listing);
  }

  return null;
}

export async function searchPedigreeHorseCandidates(
  supabase: SupabaseClient,
  query: string,
  sex: "mare" | "stallion"
): Promise<{ candidates: BreedingCandidate[]; error?: string }> {
  const safeQuery = escapeIlikePattern(query);
  const normalizedPattern = safeQuery.replace(/\s+/g, "%");

  let request = supabase
    .from("pedigree_horses")
    .select("id, name, sex, birth_year, studbook, registration_number, verified, sire_id, dam_id")
    .in("sex", sex === "mare" ? ["mare", "unknown"] : ["stallion", "unknown"])
    .order("name", { ascending: true })
    .limit(25);

  request = request.or(
    `name.ilike.%${safeQuery}%,normalized_name.ilike.%${normalizedPattern}%`
  );

  const { data, error } = await request;
  if (error || !data) {
    return { candidates: [], error: error?.message };
  }

  const candidates: BreedingCandidate[] = (data as Array<Record<string, unknown>>).map((row) => {
    const horse = rowToPedigreeHorse(row);
    return {
      id: horse.id,
      name: horse.name,
      sex: horse.sex,
      birthYear: horse.birthYear,
      studbook: horse.studbook,
      registrationNumber: horse.registrationNumber,
      sireName: null,
      damSireName: null,
      verified: horse.verified,
      source: "pedigree",
      sourceId: null,
    };
  });

  return { candidates: await enrichCandidatesWithPedigreeMetadata(supabase, candidates) };
}

export async function searchListingBreedingCandidates(
  supabase: SupabaseClient,
  query: string,
  sex: "mare" | "stallion",
  userId: string | null,
  existingIds: Set<string>
): Promise<BreedingCandidate[]> {
  const safeQuery = escapeIlikePattern(query);
  const genders = sex === "mare" ? ["Mare"] : ["Stallion"];

  const { data: listings } = await supabase
    .from("horse_listings")
    .select(
      "id, user_id, name, breed, gender, age, color, country, sire, dam, dam_sire, verified, pedigree_horse_id, status"
    )
    .eq("status", "active")
    .in("gender", genders)
    .ilike("name", `%${safeQuery}%`)
    .order("name", { ascending: true })
    .limit(15);

  const candidates: BreedingCandidate[] = [];

  for (const row of listings ?? []) {
    const listing = row as HorseListingRow;
    const pedigreeId = await resolveListingPedigreeId(supabase, listing, userId);
    if (!pedigreeId || existingIds.has(pedigreeId)) continue;

    existingIds.add(pedigreeId);
    candidates.push({
      id: pedigreeId,
      name: listing.name,
      sex: sex === "mare" ? "mare" : "stallion",
      birthYear: estimateBirthYearFromAge(listing.age),
      studbook: null,
      registrationNumber: null,
      sireName: listing.sire || null,
      damSireName: listing.dam_sire || null,
      verified: false,
      source: "listing",
      sourceId: listing.id,
    });
  }

  return enrichCandidatesWithPedigreeMetadata(supabase, candidates);
}

export async function searchStallionDirectoryBreedingCandidates(
  supabase: SupabaseClient,
  query: string,
  existingIds: Set<string>
): Promise<BreedingCandidate[]> {
  const safeQuery = escapeIlikePattern(query);

  const { data: directoryRows } = await supabase
    .from("stallions")
    .select(
      "id, owner_id, name, pedigree_horse_id, birth_year, studbook, verified, sire, dam, dam_sire, status"
    )
    .eq("status", "active")
    .or(`name.ilike.%${safeQuery}%,sire.ilike.%${safeQuery}%`)
    .order("name", { ascending: true })
    .limit(15);

  const candidates: BreedingCandidate[] = [];

  for (const row of directoryRows ?? []) {
    let pedigreeHorseId = row.pedigree_horse_id as string | null;
    if (!pedigreeHorseId) {
      pedigreeHorseId = await ensureStallionPedigreeHorseId(supabase, row.id as string);
    }
    if (!pedigreeHorseId || existingIds.has(pedigreeHorseId)) continue;

    existingIds.add(pedigreeHorseId);
    candidates.push({
      id: pedigreeHorseId,
      name: row.name as string,
      sex: "stallion",
      birthYear: (row.birth_year as number | null) ?? null,
      studbook: (row.studbook as string | null) ?? null,
      registrationNumber: null,
      sireName: (row.sire as string | null) ?? null,
      damSireName: (row.dam_sire as string | null) ?? null,
      verified: false,
      source: "stallion_directory",
      sourceId: row.id as string,
    });
  }

  return enrichCandidatesWithPedigreeMetadata(supabase, candidates);
}
