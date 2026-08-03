import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PedigreeHorse,
  PedigreeHorseRow,
  PedigreeSex,
  PedigreeTreeNode,
} from "@/app/types/pedigree";

export const UNKNOWN_PEDIGREE_LABEL = "Unknown";
export const MAX_PEDIGREE_GENERATIONS = 4;

export function parsePedigreeVerified(value: unknown): boolean {
  return value === true;
}

export function getPedigreeLinkedCoverUrl(row: {
  cover_image_url?: string | null;
  image_urls?: unknown;
}): string | null {
  if (typeof row.cover_image_url === "string" && row.cover_image_url.trim()) {
    return row.cover_image_url.trim();
  }

  if (Array.isArray(row.image_urls)) {
    for (const item of row.image_urls) {
      if (typeof item === "string" && item.trim()) {
        return item.trim();
      }
    }
  }

  return null;
}

export function normalizePedigreeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function rowToPedigreeHorse(row: Record<string, unknown>): PedigreeHorse {
  const sex = row.sex as string;
  const allowed: PedigreeSex[] = ["stallion", "mare", "gelding", "unknown"];

  return {
    id: String(row.id),
    name: String(row.name),
    normalizedName: String(row.normalized_name),
    sex: allowed.includes(sex as PedigreeSex) ? (sex as PedigreeSex) : "unknown",
    birthYear: row.birth_year === null || row.birth_year === undefined ? null : Number(row.birth_year),
    breed: (row.breed as string | null) ?? null,
    studbook: (row.studbook as string | null) ?? null,
    registrationNumber: (row.registration_number as string | null) ?? null,
    color: (row.color as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    sireId: (row.sire_id as string | null) ?? null,
    damId: (row.dam_id as string | null) ?? null,
    externalReference: (row.external_reference as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    verified: parsePedigreeVerified(row.verified),
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapListingGenderToPedigreeSex(gender: string): PedigreeSex {
  const normalized = gender.trim().toLowerCase();
  if (normalized === "stallion") return "stallion";
  if (normalized === "mare") return "mare";
  if (normalized === "gelding") return "gelding";
  return "unknown";
}

export function estimateBirthYearFromAge(age: number): number | null {
  if (!Number.isFinite(age) || age < 0 || age > 50) {
    return null;
  }

  return new Date().getFullYear() - Math.round(age);
}

export function createUnknownPedigreeNode(name = UNKNOWN_PEDIGREE_LABEL): PedigreeTreeNode {
  return {
    id: null,
    name: name.trim() || UNKNOWN_PEDIGREE_LABEL,
    sex: "unknown",
    birthYear: null,
    verified: false,
    sire: null,
    dam: null,
  };
}

export function rowToPedigreeTreeNode(row: PedigreeHorse): PedigreeTreeNode {
  return {
    id: row.id,
    name: row.name,
    sex: row.sex,
    birthYear: row.birthYear,
    verified: row.verified,
    sire: null,
    dam: null,
  };
}

export function pedigreeGenerationPaths(maxGeneration: number): Array<Array<"sire" | "dam">> {
  const paths: Array<Array<"sire" | "dam">> = [[]];

  for (let generation = 1; generation <= maxGeneration; generation += 1) {
    const previous = paths.filter((path) => path.length === generation - 1);
    for (const path of previous) {
      paths.push([...path, "sire"]);
      paths.push([...path, "dam"]);
    }
  }

  return paths;
}

export function getPedigreeNodeAtPath(
  root: PedigreeTreeNode,
  path: Array<"sire" | "dam">
): PedigreeTreeNode | null {
  let current: PedigreeTreeNode | null = root;

  for (const step of path) {
    if (!current) return null;
    current = current[step];
  }

  return current;
}

export function formatPedigreeSexLabel(sex: PedigreeSex): string {
  switch (sex) {
    case "stallion":
      return "Stallion";
    case "mare":
      return "Mare";
    case "gelding":
      return "Gelding";
    default:
      return "Unknown";
  }
}

export function formatPedigreeIdentityLine(horse: {
  name: string;
  birthYear: number | null;
  sex: PedigreeSex;
  studbook: string | null;
  sireName?: string | null;
  damSireName?: string | null;
}): string {
  const parts = [
    horse.birthYear ? String(horse.birthYear) : null,
    formatPedigreeSexLabel(horse.sex),
    horse.studbook,
  ].filter(Boolean);

  const line = parts.length > 0 ? `${horse.name} · ${parts.join(" · ")}` : horse.name;

  if (horse.sireName || horse.damSireName) {
    return `${line} · ${horse.sireName ?? "—"} × ${horse.damSireName ?? "—"}`;
  }

  return line;
}

export type PedigreeUpsertInput = {
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
};

export function buildPedigreeInsertRow(
  input: PedigreeUpsertInput,
  createdBy: string
): Record<string, unknown> {
  return {
    name: input.name.trim(),
    normalized_name: normalizePedigreeName(input.name),
    sex: input.sex,
    birth_year: input.birthYear ?? null,
    breed: input.breed?.trim() || null,
    studbook: input.studbook?.trim() || null,
    registration_number: input.registrationNumber?.trim() || null,
    color: input.color?.trim() || null,
    country: input.country?.trim() || null,
    sire_id: input.sireId ?? null,
    dam_id: input.damId ?? null,
    created_by: createdBy,
    verified: false,
  };
}

export async function findConservativePedigreeMatch(
  supabase: SupabaseClient,
  input: {
    name: string;
    sex?: PedigreeSex;
    birthYear?: number | null;
    studbook?: string | null;
    registrationNumber?: string | null;
  }
): Promise<string | null> {
  const registration = input.registrationNumber?.trim();
  if (registration) {
    const { data } = await supabase
      .from("pedigree_horses")
      .select("id")
      .eq("registration_number", registration)
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      return data.id as string;
    }
  }

  const normalized = normalizePedigreeName(input.name);
  if (!normalized) {
    return null;
  }

  if (input.birthYear && input.sex && input.sex !== "unknown") {
    let query = supabase
      .from("pedigree_horses")
      .select("id")
      .eq("normalized_name", normalized)
      .eq("birth_year", input.birthYear)
      .eq("sex", input.sex)
      .limit(1);

    if (input.studbook?.trim()) {
      query = query.eq("studbook", input.studbook.trim());
    }

    const { data } = await query.maybeSingle();
    if (data?.id) {
      return data.id as string;
    }
  }

  return null;
}

export async function loadPedigreeTree(
  supabase: SupabaseClient,
  rootId: string,
  maxGenerations = MAX_PEDIGREE_GENERATIONS,
  cache = new Map<string, PedigreeHorseRow>()
): Promise<PedigreeTreeNode | null> {
  const rowsMap = new Map<string, PedigreeHorseRow>(cache);

  let frontier = [rootId];
  const loaded = new Set<string>();

  for (let depth = 0; depth <= maxGenerations && frontier.length > 0; depth += 1) {
    const toFetch = frontier.filter((id) => !loaded.has(id) && !rowsMap.has(id));

    if (toFetch.length > 0) {
      const { data } = await supabase.from("pedigree_horses").select("*").in("id", toFetch);

      for (const row of data ?? []) {
        const pedigreeRow = row as PedigreeHorseRow;
        rowsMap.set(pedigreeRow.id, pedigreeRow);
        cache.set(pedigreeRow.id, pedigreeRow);
      }
    }

    for (const id of frontier) {
      loaded.add(id);
    }

    if (depth >= maxGenerations) {
      break;
    }

    const nextFrontier: string[] = [];

    for (const id of frontier) {
      const row = rowsMap.get(id);
      if (!row) continue;

      const horse = rowToPedigreeHorse(row as Record<string, unknown>);

      if (horse.sireId && !loaded.has(horse.sireId)) {
        nextFrontier.push(horse.sireId);
      }

      if (horse.damId && !loaded.has(horse.damId)) {
        nextFrontier.push(horse.damId);
      }
    }

    frontier = [...new Set(nextFrontier)];
  }

  if (!rowsMap.has(rootId)) {
    return null;
  }

  function buildNode(id: string, depth: number): PedigreeTreeNode {
    const row = rowsMap.get(id);
    if (!row) {
      return createUnknownPedigreeNode();
    }

    const horse = rowToPedigreeHorse(row as Record<string, unknown>);
    const node = rowToPedigreeTreeNode(horse);

    if (depth >= maxGenerations) {
      return node;
    }

    node.sire = horse.sireId ? buildNode(horse.sireId, depth + 1) : null;
    node.dam = horse.damId ? buildNode(horse.damId, depth + 1) : null;
    return node;
  }

  return buildNode(rootId, 0);
}
