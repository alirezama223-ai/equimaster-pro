import {
  AncestorOccurrence,
  AncestorPathStep,
  BreedingPedigreeSide,
  LoadedPedigreeRecord,
  PedigreeGraph,
} from "@/app/types/breeding";
import { BREEDING_MAX_GENERATIONS } from "@/app/lib/breeding/constants";
import { PedigreeTreeNode } from "@/app/types/pedigree";

export function collectAncestorOccurrences(
  graph: PedigreeGraph,
  rootId: string,
  side: BreedingPedigreeSide,
  maxGenerations = BREEDING_MAX_GENERATIONS
): AncestorOccurrence[] {
  const occurrences: AncestorOccurrence[] = [];
  const visitedPaths = new Set<string>();

  function walk(
    currentId: string,
    generation: number,
    path: AncestorPathStep[],
    lineageVisited: Set<string>
  ) {
    if (generation > maxGenerations) return;
    if (lineageVisited.has(currentId)) return;

    const record = graph.get(currentId);
    if (!record) return;

    const nextVisited = new Set(lineageVisited);
    nextVisited.add(currentId);

    if (generation >= 1) {
      const pathKey = `${currentId}:${path.join("-")}`;
      if (!visitedPaths.has(pathKey)) {
        visitedPaths.add(pathKey);
        occurrences.push({
          ancestorId: currentId,
          generation,
          path: [...path],
          side,
        });
      }
    }

    if (record.sireId) {
      walk(record.sireId, generation + 1, [...path, "sire"], nextVisited);
    }
    if (record.damId) {
      walk(record.damId, generation + 1, [...path, "dam"], nextVisited);
    }
  }

  walk(rootId, 0, [], new Set());
  return occurrences;
}

export function groupOccurrencesByAncestor(
  occurrences: AncestorOccurrence[]
): Map<string, AncestorOccurrence[]> {
  const grouped = new Map<string, AncestorOccurrence[]>();
  for (const occurrence of occurrences) {
    const list = grouped.get(occurrence.ancestorId) ?? [];
    list.push(occurrence);
    grouped.set(occurrence.ancestorId, list);
  }
  return grouped;
}

export function buildTreeNodeFromGraph(
  graph: PedigreeGraph,
  rootId: string,
  maxGenerations: number,
  depth = 0,
  lineageVisited = new Set<string>()
): PedigreeTreeNode | null {
  if (depth > maxGenerations || lineageVisited.has(rootId)) {
    return null;
  }

  const record = graph.get(rootId);
  if (!record) return null;

  const nextVisited = new Set(lineageVisited);
  nextVisited.add(rootId);

  const node: PedigreeTreeNode = {
    id: record.id,
    name: record.name,
    sex: record.sex,
    birthYear: record.birthYear,
    verified: record.verified,
    sire: null,
    dam: null,
  };

  if (depth < maxGenerations) {
    if (record.sireId) {
      node.sire = buildTreeNodeFromGraph(graph, record.sireId, maxGenerations, depth + 1, nextVisited);
    }
    if (record.damId) {
      node.dam = buildTreeNodeFromGraph(graph, record.damId, maxGenerations, depth + 1, nextVisited);
    }
  }

  return node;
}

export function getDirectParents(
  graph: PedigreeGraph,
  record: LoadedPedigreeRecord
): { sire: LoadedPedigreeRecord | null; dam: LoadedPedigreeRecord | null } {
  return {
    sire: record.sireId ? graph.get(record.sireId) ?? null : null,
    dam: record.damId ? graph.get(record.damId) ?? null : null,
  };
}

export function getGrandparentIds(record: LoadedPedigreeRecord, graph: PedigreeGraph): string[] {
  const ids: string[] = [];
  const sire = record.sireId ? graph.get(record.sireId) : null;
  const dam = record.damId ? graph.get(record.damId) : null;
  if (sire?.sireId) ids.push(sire.sireId);
  if (sire?.damId) ids.push(sire.damId);
  if (dam?.sireId) ids.push(dam.sireId);
  if (dam?.damId) ids.push(dam.damId);
  return ids;
}
