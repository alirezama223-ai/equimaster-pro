import { BREEDING_MAX_GENERATIONS } from "@/app/lib/breeding/constants";
import { isAncestorOf, sharesParent } from "@/app/lib/breeding/common-ancestors";
import { getGrandparentIds } from "@/app/lib/breeding/traversal";
import {
  AncestorOccurrence,
  CloseRelationshipWarning,
  LoadedPedigreeRecord,
  PedigreeGraph,
} from "@/app/types/breeding";

export function detectCloseRelationships(
  graph: PedigreeGraph,
  mare: LoadedPedigreeRecord,
  stallion: LoadedPedigreeRecord,
  mareOccurrences: AncestorOccurrence[],
  stallionOccurrences: AncestorOccurrence[]
): CloseRelationshipWarning[] {
  const warnings: CloseRelationshipWarning[] = [];

  if (mare.id === stallion.id) {
    warnings.push({
      kind: "same_horse",
      title: "Same pedigree record selected",
      explanation:
        "The selected mare and stallion refer to the same pedigree record. A breeding analysis requires two distinct horses.",
      severity: "critical",
    });
    return warnings;
  }

  if (mare.sireId === stallion.id || mare.damId === stallion.id) {
    warnings.push({
      kind: "parent_offspring",
      title: "Close pedigree relationship detected",
      explanation:
        "The selected stallion appears as a direct parent (sire or dam) of the selected mare in structured pedigree data.",
      severity: "critical",
    });
  }

  if (stallion.sireId === mare.id || stallion.damId === mare.id) {
    warnings.push({
      kind: "parent_offspring",
      title: "Close pedigree relationship detected",
      explanation:
        "The selected mare appears as a direct parent (sire or dam) of the selected stallion in structured pedigree data.",
      severity: "critical",
    });
  }

  const sibling = sharesParent(mare, stallion);
  if (sibling.sharedSire && sibling.sharedDam) {
    warnings.push({
      kind: "full_sibling",
      title: "Close pedigree relationship detected",
      explanation:
        "The selected mare and stallion share the same recorded sire and dam, indicating a full sibling relationship in the available pedigree data.",
      severity: "critical",
    });
  } else if (sibling.sharedSire || sibling.sharedDam) {
    warnings.push({
      kind: "half_sibling",
      title: "Close pedigree relationship detected",
      explanation:
        "The selected mare and stallion share one recorded parent, indicating a half sibling relationship in the available pedigree data.",
      severity: "high",
    });
  }

  const mareGrandparents = new Set(getGrandparentIds(mare, graph));
  if (mareGrandparents.has(stallion.id)) {
    warnings.push({
      kind: "grandparent_grandoffspring",
      title: "Close pedigree relationship detected",
      explanation:
        "The selected stallion appears as a recorded grandparent of the selected mare.",
      severity: "high",
    });
  }

  const stallionGrandparents = new Set(getGrandparentIds(stallion, graph));
  if (stallionGrandparents.has(mare.id)) {
    warnings.push({
      kind: "grandparent_grandoffspring",
      title: "Close pedigree relationship detected",
      explanation:
        "The selected mare appears as a recorded grandparent of the selected stallion.",
      severity: "high",
    });
  }

  const mareHasStallion = mareOccurrences.some(
    (item) => item.ancestorId === stallion.id && item.generation <= 2
  );
  const stallionHasMare = stallionOccurrences.some(
    (item) => item.ancestorId === mare.id && item.generation <= 2
  );

  if (
    !warnings.some((item) => item.kind === "parent_offspring" || item.kind === "grandparent_grandoffspring")
  ) {
    if (mareHasStallion || stallionHasMare) {
      warnings.push({
        kind: "direct_ancestor_descendant",
        title: "Close pedigree relationship detected",
        explanation:
          "One selected horse appears within two generations of the other's recorded ancestry. Close crosses may increase genetic risk and should be reviewed with qualified breeding or genetic professionals.",
        severity: "high",
      });
    }
  }

  if (
    isAncestorOf(graph, stallion.id, mare.id, BREEDING_MAX_GENERATIONS) ||
    isAncestorOf(graph, mare.id, stallion.id, BREEDING_MAX_GENERATIONS)
  ) {
    const alreadyCovered = warnings.some(
      (item) =>
        item.kind === "parent_offspring" ||
        item.kind === "grandparent_grandoffspring" ||
        item.kind === "direct_ancestor_descendant"
    );
    if (!alreadyCovered) {
      warnings.push({
        kind: "direct_ancestor_descendant",
        title: "Close pedigree relationship detected",
        explanation:
          "One selected horse appears in the other's recorded ancestry within the analyzed pedigree depth. Close crosses may increase genetic risk and should be reviewed with qualified breeding or genetic professionals.",
        severity: "high",
      });
    }
  }

  return warnings;
}

export const CLOSE_RELATIONSHIP_ADVISORY =
  "Close pedigree relationships may increase genetic risk. This analysis does not provide veterinary advice; consult qualified breeding and genetic professionals before making reproductive decisions.";
