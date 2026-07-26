import { BREEDING_MAX_GENERATIONS } from "@/app/lib/breeding/constants";
import {
  DataConfidence,
  DataConfidenceLevel,
  PedigreeCompletenessMetrics,
  PedigreeGraph,
} from "@/app/types/breeding";

function expectedAncestorSlots(maxGenerations: number): number {
  let total = 0;
  for (let generation = 1; generation <= maxGenerations; generation += 1) {
    total += 2 ** generation;
  }
  return total;
}

export function calculatePedigreeCompleteness(
  graph: PedigreeGraph,
  rootId: string,
  maxGenerations = BREEDING_MAX_GENERATIONS
): PedigreeCompletenessMetrics {
  let knownAncestorSlots = 0;
  let verifiedAncestorCount = 0;

  function walk(currentId: string, generation: number, lineageVisited: Set<string>) {
    if (generation > maxGenerations) return;
    if (lineageVisited.has(currentId)) return;

    const record = graph.get(currentId);
    if (!record) return;

    const nextVisited = new Set(lineageVisited);
    nextVisited.add(currentId);

    if (generation >= 1) {
      knownAncestorSlots += 1;
      if (record.verified) verifiedAncestorCount += 1;
    }

    if (record.sireId) {
      walk(record.sireId, generation + 1, nextVisited);
    } else if (generation < maxGenerations) {
      // Missing sire branch — do not count unknown phantom slots as known.
    }

    if (record.damId) {
      walk(record.damId, generation + 1, nextVisited);
    }
  }

  walk(rootId, 0, new Set());

  const expected = expectedAncestorSlots(maxGenerations);
  const completenessPercent =
    expected === 0 ? 100 : Math.round((knownAncestorSlots / expected) * 1000) / 10;

  const verifiedAncestorPercent =
    knownAncestorSlots === 0
      ? 0
      : Math.round((verifiedAncestorCount / knownAncestorSlots) * 1000) / 10;

  return {
    analyzedGenerations: maxGenerations,
    expectedAncestorSlots: expected,
    knownAncestorSlots,
    completenessPercent,
    verifiedAncestorCount,
    verifiedAncestorPercent,
  };
}

export function calculateDataConfidence(
  mareMetrics: PedigreeCompletenessMetrics,
  stallionMetrics: PedigreeCompletenessMetrics
): DataConfidence {
  const averageCompleteness =
    (mareMetrics.completenessPercent + stallionMetrics.completenessPercent) / 2;
  const minCompleteness = Math.min(
    mareMetrics.completenessPercent,
    stallionMetrics.completenessPercent
  );

  let level: DataConfidenceLevel = "limited";
  if (minCompleteness >= 75 && averageCompleteness >= 85) {
    level = "high";
  } else if (minCompleteness >= 50 && averageCompleteness >= 60) {
    level = "moderate";
  }

  const label =
    level === "high" ? "High" : level === "moderate" ? "Moderate" : "Limited";

  return {
    level,
    label,
    explanation:
      "Data Confidence reflects pedigree completeness and identity coverage in the analyzed generations only. It does not predict foal quality, health, or performance. Verified records improve identity confidence but do not confirm biological or genetic correctness.",
    mareCompleteness: mareMetrics,
    stallionCompleteness: stallionMetrics,
  };
}
