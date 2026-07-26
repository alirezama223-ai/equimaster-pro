"use server";

import { revalidatePath } from "next/cache";
import { analyzeBreedingCompare, analyzeBreedingCross } from "@/app/lib/breeding/analyze";
import {
  searchListingBreedingCandidates,
  searchPedigreeHorseCandidates,
  searchStallionDirectoryBreedingCandidates,
} from "@/app/lib/breeding/candidate-search";
import { createClient } from "@/app/lib/supabase/server";
import { rowToPedigreeHorse } from "@/app/lib/pedigree";
import {
  BreedingAnalysisReport,
  BreedingCandidate,
  SavedBreedingAnalysis,
} from "@/app/types/breeding";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

async function canReadPedigreeRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pedigreeId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("pedigree_horses")
    .select("id")
    .eq("id", pedigreeId)
    .maybeSingle();
  return Boolean(data?.id);
}

async function resolveStallionDirectoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stallionDirectoryId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("stallions")
    .select("pedigree_horse_id")
    .eq("id", stallionDirectoryId)
    .eq("status", "active")
    .maybeSingle();

  return (data?.pedigree_horse_id as string | undefined) ?? null;
}

export async function resolveBreedingLabPrefill(input: {
  mare?: string;
  stallion?: string;
  stallionDirectory?: string;
}): Promise<{ mareId: string | null; stallionId: string | null }> {
  const supabase = await createClient();
  let mareId = isUuid(input.mare) ? input.mare : null;
  let stallionId = isUuid(input.stallion) ? input.stallion : null;

  if (!stallionId && isUuid(input.stallionDirectory)) {
    stallionId = await resolveStallionDirectoryId(supabase, input.stallionDirectory);
  }

  if (mareId && !(await canReadPedigreeRecord(supabase, mareId))) {
    mareId = null;
  }
  if (stallionId && !(await canReadPedigreeRecord(supabase, stallionId))) {
    stallionId = null;
  }

  return { mareId, stallionId };
}

export async function searchBreedingCandidates(input: {
  query?: string;
  sex: "mare" | "stallion";
}) {
  const supabase = await createClient();
  const query = input.query?.trim() ?? "";

  if (query.length < 2) {
    return { candidates: [] as BreedingCandidate[] };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pedigreeResult = await searchPedigreeHorseCandidates(supabase, query, input.sex);
  if (pedigreeResult.error) {
    return { candidates: [], error: pedigreeResult.error };
  }

  const existingIds = new Set(pedigreeResult.candidates.map((candidate) => candidate.id));
  const listingCandidates = await searchListingBreedingCandidates(
    supabase,
    query,
    input.sex,
    user?.id ?? null,
    existingIds
  );

  const candidates = [...pedigreeResult.candidates, ...listingCandidates];

  if (input.sex === "stallion") {
    const directoryCandidates = await searchStallionDirectoryBreedingCandidates(
      supabase,
      query,
      existingIds
    );
    candidates.push(...directoryCandidates);
  }

  candidates.sort((a, b) => a.name.localeCompare(b.name));

  return { candidates: candidates.slice(0, 25) };
}

export async function getBreedingCandidateById(pedigreeId: string) {
  if (!isUuid(pedigreeId)) {
    return { candidate: null, error: "Invalid pedigree ID." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedigree_horses")
    .select("id, name, sex, birth_year, studbook, registration_number, verified, sire_id, dam_id")
    .eq("id", pedigreeId)
    .maybeSingle();

  if (error || !data) {
    return { candidate: null, error: error?.message ?? "Pedigree record not found." };
  }

  const horse = rowToPedigreeHorse(data as Record<string, unknown>);
  const [{ data: sire }, { data: dam }] = await Promise.all([
    horse.sireId
      ? supabase.from("pedigree_horses").select("name, sire_id").eq("id", horse.sireId).maybeSingle()
      : Promise.resolve({ data: null }),
    horse.damId
      ? supabase.from("pedigree_horses").select("name, sire_id").eq("id", horse.damId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let damSireName: string | null = null;
  if (dam?.sire_id) {
    const { data: damSire } = await supabase
      .from("pedigree_horses")
      .select("name")
      .eq("id", dam.sire_id as string)
      .maybeSingle();
    damSireName = (damSire?.name as string | undefined) ?? null;
  }

  return {
    candidate: {
      id: horse.id,
      name: horse.name,
      sex: horse.sex,
      birthYear: horse.birthYear,
      studbook: horse.studbook,
      registrationNumber: horse.registrationNumber,
      sireName: (sire?.name as string | undefined) ?? null,
      damSireName,
      verified: horse.verified,
      source: "pedigree" as const,
      sourceId: null,
    } satisfies BreedingCandidate,
  };
}

export async function runBreedingAnalysis(input: {
  marePedigreeId: string;
  stallionPedigreeId: string;
}): Promise<{ report: BreedingAnalysisReport | null; error?: string }> {
  if (!isUuid(input.marePedigreeId) || !isUuid(input.stallionPedigreeId)) {
    return { report: null, error: "Invalid mare or stallion pedigree ID." };
  }

  const supabase = await createClient();
  const readable = await Promise.all([
    canReadPedigreeRecord(supabase, input.marePedigreeId),
    canReadPedigreeRecord(supabase, input.stallionPedigreeId),
  ]);

  if (!readable[0] || !readable[1]) {
    return { report: null, error: "You are not authorized to analyze one or both selected records." };
  }

  return analyzeBreedingCross(supabase, input.marePedigreeId, input.stallionPedigreeId);
}

export async function runBreedingCompare(input: {
  marePedigreeId: string;
  stallionPedigreeIds: string[];
}): Promise<{ reports: BreedingAnalysisReport[]; error?: string }> {
  if (!isUuid(input.marePedigreeId)) {
    return { reports: [], error: "Invalid mare pedigree ID." };
  }

  const stallionIds = input.stallionPedigreeIds.filter(isUuid).slice(0, 3);
  if (stallionIds.length === 0) {
    return { reports: [], error: "Select at least one valid stallion pedigree ID." };
  }

  const supabase = await createClient();
  const readable = await Promise.all([
    canReadPedigreeRecord(supabase, input.marePedigreeId),
    ...stallionIds.map((id) => canReadPedigreeRecord(supabase, id)),
  ]);

  if (readable.some((item) => !item)) {
    return { reports: [], error: "You are not authorized to analyze one or more selected records." };
  }

  return analyzeBreedingCompare(supabase, input.marePedigreeId, stallionIds);
}

export async function saveBreedingAnalysis(input: {
  marePedigreeId: string;
  stallionPedigreeId: string;
  title?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to save breeding analyses." };
  }

  if (!isUuid(input.marePedigreeId) || !isUuid(input.stallionPedigreeId)) {
    return { error: "Invalid mare or stallion pedigree ID." };
  }

  const { data, error } = await supabase
    .from("breeding_analyses")
    .insert({
      user_id: user.id,
      mare_pedigree_id: input.marePedigreeId,
      stallion_pedigree_id: input.stallionPedigreeId,
      title: input.title?.trim() || null,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/breeding-lab");
  return { data: data?.id as string };
}

export async function getSavedBreedingAnalyses(): Promise<{
  analyses: SavedBreedingAnalysis[];
  unauthenticated?: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { analyses: [], unauthenticated: true };
  }

  const { data, error } = await supabase
    .from("breeding_analyses")
    .select("id, title, mare_pedigree_id, stallion_pedigree_id, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return { analyses: [] };
  }

  const pedigreeIds = [
    ...data.map((row) => row.mare_pedigree_id as string),
    ...data.map((row) => row.stallion_pedigree_id as string),
  ];

  const { data: pedigreeRows } = await supabase
    .from("pedigree_horses")
    .select("id, name")
    .in("id", pedigreeIds);

  const nameMap = new Map<string, string>();
  for (const row of pedigreeRows ?? []) {
    nameMap.set(row.id as string, row.name as string);
  }

  return {
    analyses: data.map((row) => ({
      id: row.id as string,
      title: (row.title as string | null) ?? null,
      marePedigreeId: row.mare_pedigree_id as string,
      stallionPedigreeId: row.stallion_pedigree_id as string,
      mareName: nameMap.get(row.mare_pedigree_id as string) ?? "Unknown mare",
      stallionName: nameMap.get(row.stallion_pedigree_id as string) ?? "Unknown stallion",
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    })),
  };
}

export async function deleteSavedBreedingAnalysis(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to delete saved analyses." };
  }

  if (!isUuid(id)) {
    return { error: "Invalid analysis ID." };
  }

  const { data, error } = await supabase
    .from("breeding_analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Saved analysis not found." };
  }

  revalidatePath("/breeding-lab");
  return { data: true };
}
