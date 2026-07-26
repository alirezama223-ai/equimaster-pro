import {
  CommonAncestorResult,
  LoadedPedigreeRecord,
  PedigreeGraph,
  SideOccurrenceSummary,
} from "@/app/types/breeding";
import { AncestorOccurrence } from "@/app/types/breeding";
import { groupOccurrencesByAncestor } from "@/app/lib/breeding/traversal";

function summarizeSide(
  side: "stallion" | "mare",
  occurrences: AncestorOccurrence[]
): SideOccurrenceSummary {
  const generations = occurrences.map((item) => item.generation);
  return {
    side,
    closestGeneration: generations.length > 0 ? Math.min(...generations) : 0,
    generations: [...new Set(generations)].sort((a, b) => a - b),
    occurrenceCount: occurrences.length,
    paths: occurrences.map((item) => item.path),
  };
}

export function detectCommonAncestors(
  graph: PedigreeGraph,
  stallionOccurrences: AncestorOccurrence[],
  mareOccurrences: AncestorOccurrence[]
): CommonAncestorResult[] {
  const stallionGrouped = groupOccurrencesByAncestor(stallionOccurrences);
  const mareGrouped = groupOccurrencesByAncestor(mareOccurrences);

  const commonIds = [...stallionGrouped.keys()].filter((id) => mareGrouped.has(id));

  const results: CommonAncestorResult[] = commonIds.map((ancestorId) => {
    const stallionSide = summarizeSide("stallion", stallionGrouped.get(ancestorId) ?? []);
    const mareSide = summarizeSide("mare", mareGrouped.get(ancestorId) ?? []);
    const record = graph.get(ancestorId);

    return {
      ancestorId,
      name: record?.name ?? "Unknown",
      verified: record?.verified ?? false,
      stallionSide,
      mareSide,
      isRepeated: stallionSide.occurrenceCount + mareSide.occurrenceCount > 2,
    };
  });

  return results.sort((a, b) => {
    const aDepth = a.stallionSide.closestGeneration + a.mareSide.closestGeneration;
    const bDepth = b.stallionSide.closestGeneration + b.mareSide.closestGeneration;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.name.localeCompare(b.name);
  });
}

export function getClosestCommonAncestor(
  commonAncestors: CommonAncestorResult[]
): CommonAncestorResult | null {
  if (commonAncestors.length === 0) return null;
  return commonAncestors[0];
}

export function isAncestorOf(
  graph: PedigreeGraph,
  ancestorId: string,
  descendantId: string,
  maxGenerations: number
): boolean {
  let frontier = [{ id: descendantId, generation: 0 }];
  const visited = new Set<string>();

  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const item of frontier) {
      if (visited.has(item.id)) continue;
      visited.add(item.id);

      const record = graph.get(item.id);
      if (!record) continue;

      for (const parentId of [record.sireId, record.damId]) {
        if (!parentId) continue;
        if (parentId === ancestorId) return true;
        if (item.generation + 1 <= maxGenerations) {
          next.push({ id: parentId, generation: item.generation + 1 });
        }
      }
    }
    frontier = next;
  }

  return false;
}

export function sharesParent(
  a: LoadedPedigreeRecord,
  b: LoadedPedigreeRecord
): { sharedSire: boolean; sharedDam: boolean } {
  return {
    sharedSire: Boolean(a.sireId && b.sireId && a.sireId === b.sireId),
    sharedDam: Boolean(a.damId && b.damId && a.damId === b.damId),
  };
}
