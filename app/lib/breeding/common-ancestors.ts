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

/**
 * A common ancestor is useful for linebreeding analysis only when it is a
 * minimal shared ancestor: another shared ancestor must not be an ancestor of
 * it on either selected side. Otherwise a single shared bloodline chain can
 * be reported once for every node in that chain, inflating the result count
 * and creating misleading repeated 4x4/5x5 patterns.
 */
function filterMinimalCommonAncestorIds(
  graph: PedigreeGraph,
  commonIds: string[],
  stallionOccurrences: AncestorOccurrence[],
  mareOccurrences: AncestorOccurrence[]
): string[] {
  const stallionById = groupOccurrencesByAncestor(stallionOccurrences);
  const mareById = groupOccurrencesByAncestor(mareOccurrences);

  const isAncestorOnSide = (ancestorId: string, descendantId: string): boolean => {
    if (ancestorId === descendantId) return false;

    const descendantOccurrences = [
      ...(stallionById.get(descendantId) ?? []),
      ...(mareById.get(descendantId) ?? []),
    ];
    const ancestorOccurrences = [
      ...(stallionById.get(ancestorId) ?? []),
      ...(mareById.get(ancestorId) ?? []),
    ];

    for (const descendant of descendantOccurrences) {
      for (const ancestor of ancestorOccurrences) {
        if (descendant.side !== ancestor.side) continue;
        if (ancestor.generation <= descendant.generation) continue;
        const prefix = descendant.path;
        if (ancestor.path.length >= prefix.length && prefix.every((step, index) => ancestor.path[index] === step)) {
          return true;
        }
      }
    }

    return false;
  };

  return commonIds.filter((candidateId) => {
    return !commonIds.some((otherId) => {
      if (candidateId === otherId) return false;
      return isAncestorOnSide(candidateId, otherId);
    });
  });
}

export function detectCommonAncestors(
  graph: PedigreeGraph,
  stallionOccurrences: AncestorOccurrence[],
  mareOccurrences: AncestorOccurrence[]
): CommonAncestorResult[] {
  const stallionGrouped = groupOccurrencesByAncestor(stallionOccurrences);
  const mareGrouped = groupOccurrencesByAncestor(mareOccurrences);

  const commonIds = [...stallionGrouped.keys()].filter((id) => mareGrouped.has(id));
  const minimalCommonIds = filterMinimalCommonAncestorIds(
    graph,
    commonIds,
    stallionOccurrences,
    mareOccurrences
  );

  const results: CommonAncestorResult[] = minimalCommonIds.map((ancestorId) => {
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
