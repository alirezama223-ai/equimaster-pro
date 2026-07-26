import { BREEDING_MAX_GENERATIONS } from "@/app/lib/breeding/constants";
import { buildTreeNodeFromGraph } from "@/app/lib/breeding/traversal";
import { PedigreeGraph } from "@/app/types/breeding";
import { PedigreeTreeNode } from "@/app/types/pedigree";

export function buildHypotheticalFoalTree(
  graph: PedigreeGraph,
  mareId: string,
  stallionId: string,
  maxGenerations = BREEDING_MAX_GENERATIONS
): PedigreeTreeNode {
  const sireNode = buildTreeNodeFromGraph(graph, stallionId, maxGenerations);
  const damNode = buildTreeNodeFromGraph(graph, mareId, maxGenerations);

  return {
    id: null,
    name: "Hypothetical Foal",
    sex: "unknown",
    birthYear: null,
    verified: false,
    sire: sireNode,
    dam: damNode,
  };
}
