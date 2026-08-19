import { describe, expect, it } from "vitest";
import { detectCommonAncestors } from "@/app/lib/breeding/common-ancestors";
import { collectAncestorOccurrences } from "@/app/lib/breeding/traversal";
import type { LoadedPedigreeRecord, PedigreeGraph } from "@/app/types/breeding";

function record(
  id: string,
  name: string,
  sireId: string | null = null,
  damId: string | null = null
): LoadedPedigreeRecord {
  return {
    id,
    name,
    sex: "unknown",
    birthYear: null,
    studbook: null,
    registrationNumber: null,
    verified: true,
    sireId,
    damId,
  };
}

describe("detectCommonAncestors", () => {
  it("does not report every node in one shared bloodline chain", () => {
    const graph: PedigreeGraph = new Map([
      ["mare", record("mare", "Mare", "mare-g1")],
      ["stallion", record("stallion", "Stallion", "stallion-g1")],
      ["mare-g1", record("mare-g1", "Mare G1", "shared")],
      ["stallion-g1", record("stallion-g1", "Stallion G1", "shared")],
      ["shared", record("shared", "Shared Ancestor")],
    ]);

    const stallionOccurrences = collectAncestorOccurrences(graph, "stallion", "stallion", 5);
    const mareOccurrences = collectAncestorOccurrences(graph, "mare", "mare", 5);
    const result = detectCommonAncestors(graph, stallionOccurrences, mareOccurrences);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ancestorId: "shared",
      name: "Shared Ancestor",
      stallionSide: { closestGeneration: 2 },
      mareSide: { closestGeneration: 2 },
    });
  });

  it("preserves a genuine repeated path to the same nearest common ancestor", () => {
    const graph: PedigreeGraph = new Map([
      ["mare", record("mare", "Mare", "mare-g1", "mare-dam")],
      ["stallion", record("stallion", "Stallion", "stallion-g1", "stallion-dam")],
      ["mare-g1", record("mare-g1", "Mare G1", "shared")],
      ["mare-dam", record("mare-dam", "Mare Dam", null, "shared")],
      ["stallion-g1", record("stallion-g1", "Stallion G1", "shared")],
      ["stallion-dam", record("stallion-dam", "Stallion Dam", null, "shared")],
      ["shared", record("shared", "Shared Ancestor")],
    ]);

    const stallionOccurrences = collectAncestorOccurrences(graph, "stallion", "stallion", 5);
    const mareOccurrences = collectAncestorOccurrences(graph, "mare", "mare", 5);
    const result = detectCommonAncestors(graph, stallionOccurrences, mareOccurrences);

    expect(result).toHaveLength(1);
    expect(result[0].ancestorId).toBe("shared");
    expect(result[0].isRepeated).toBe(true);
    expect(result[0].stallionSide.occurrenceCount).toBe(2);
    expect(result[0].mareSide.occurrenceCount).toBe(2);
  });
});
