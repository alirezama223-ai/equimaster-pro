import type { SupabaseClient } from "@supabase/supabase-js";
import { parsePedigreeVerified } from "@/app/lib/pedigree";
import {
  LoadedPedigreeRecord,
  PedigreeGraph,
} from "@/app/types/breeding";
import { PedigreeSex } from "@/app/types/pedigree";
import { BREEDING_MAX_GENERATIONS } from "@/app/lib/breeding/constants";

const ALLOWED_SEX: PedigreeSex[] = ["stallion", "mare", "gelding", "unknown"];

function rowToLoadedRecord(row: Record<string, unknown>): LoadedPedigreeRecord {
  const sex = row.sex as string;
  return {
    id: String(row.id),
    name: String(row.name),
    sex: ALLOWED_SEX.includes(sex as PedigreeSex) ? (sex as PedigreeSex) : "unknown",
    birthYear:
      row.birth_year === null || row.birth_year === undefined ? null : Number(row.birth_year),
    studbook: (row.studbook as string | null) ?? null,
    registrationNumber: (row.registration_number as string | null) ?? null,
    verified: parsePedigreeVerified(row.verified),
    sireId: (row.sire_id as string | null) ?? null,
    damId: (row.dam_id as string | null) ?? null,
  };
}

export async function loadPedigreeGraph(
  supabase: SupabaseClient,
  rootIds: string[],
  maxGenerations = BREEDING_MAX_GENERATIONS
): Promise<PedigreeGraph> {
  const graph: PedigreeGraph = new Map();
  const visited = new Set<string>();
  let frontier = [...new Set(rootIds.filter(Boolean))];

  for (let depth = 0; depth <= maxGenerations && frontier.length > 0; depth += 1) {
    const toFetch = frontier.filter((id) => !visited.has(id));
    if (toFetch.length === 0) break;

    for (const id of toFetch) {
      visited.add(id);
    }

    const { data, error } = await supabase
      .from("pedigree_horses")
      .select(
        "id, name, sex, birth_year, studbook, registration_number, verified, sire_id, dam_id"
      )
      .in("id", toFetch);

    if (error || !data) {
      break;
    }

    const nextFrontier: string[] = [];

    for (const row of data) {
      const record = rowToLoadedRecord(row as Record<string, unknown>);
      graph.set(record.id, record);

      if (depth < maxGenerations) {
        if (record.sireId && !visited.has(record.sireId)) {
          nextFrontier.push(record.sireId);
        }
        if (record.damId && !visited.has(record.damId)) {
          nextFrontier.push(record.damId);
        }
      }
    }

    frontier = [...new Set(nextFrontier)];
  }

  return graph;
}

export function graphRecordToPedigreeHorse(record: LoadedPedigreeRecord) {
  return {
    id: record.id,
    name: record.name,
    normalizedName: record.name.toLowerCase(),
    sex: record.sex,
    birthYear: record.birthYear,
    breed: null,
    studbook: record.studbook,
    registrationNumber: record.registrationNumber,
    color: null,
    country: null,
    sireId: record.sireId,
    damId: record.damId,
    externalReference: null,
    description: null,
    verified: record.verified,
    createdBy: null,
    createdAt: "",
    updatedAt: "",
  };
}
