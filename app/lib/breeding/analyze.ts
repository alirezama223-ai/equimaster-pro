import { BREEDING_MAX_GENERATIONS } from "@/app/lib/breeding/constants";
import {
  graphRecordToPedigreeHorse,
  loadPedigreeGraph,
} from "@/app/lib/breeding/ancestor-loader";
import {
  detectCommonAncestors,
  getClosestCommonAncestor,
} from "@/app/lib/breeding/common-ancestors";
import { detectCloseRelationships } from "@/app/lib/breeding/close-relationships";
import {
  calculateDataConfidence,
  calculatePedigreeCompleteness,
} from "@/app/lib/breeding/completeness";
import { buildHypotheticalFoalTree } from "@/app/lib/breeding/hypothetical-foal";
import {
  buildBloodlineReinforcements,
  buildLinebreedingPatterns,
} from "@/app/lib/breeding/linebreeding";
import { collectAncestorOccurrences } from "@/app/lib/breeding/traversal";
import { BreedingAnalysisReport, PedigreeGraph } from "@/app/types/breeding";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function analyzeBreedingCross(
  supabase: SupabaseClient,
  marePedigreeId: string,
  stallionPedigreeId: string,
  preloadedGraph?: PedigreeGraph
): Promise<{ report: BreedingAnalysisReport | null; error?: string }> {
  const graph =
    preloadedGraph ??
    (await loadPedigreeGraph(supabase, [marePedigreeId, stallionPedigreeId], BREEDING_MAX_GENERATIONS));

  const mareRecord = graph.get(marePedigreeId);
  const stallionRecord = graph.get(stallionPedigreeId);

  if (!mareRecord || !stallionRecord) {
    return { report: null, error: "One or both pedigree records could not be loaded." };
  }

  if (mareRecord.sex !== "mare" && mareRecord.sex !== "unknown") {
    return {
      report: null,
      error: "The selected mare record is not marked as a mare in structured pedigree data.",
    };
  }

  if (stallionRecord.sex !== "stallion" && stallionRecord.sex !== "unknown") {
    return {
      report: null,
      error:
        "The selected stallion record is not marked as a stallion in structured pedigree data.",
    };
  }

  const stallionOccurrences = collectAncestorOccurrences(
    graph,
    stallionPedigreeId,
    "stallion",
    BREEDING_MAX_GENERATIONS
  );
  const mareOccurrences = collectAncestorOccurrences(
    graph,
    marePedigreeId,
    "mare",
    BREEDING_MAX_GENERATIONS
  );

  const commonAncestors = detectCommonAncestors(graph, stallionOccurrences, mareOccurrences);
  const linebreedingPatterns = buildLinebreedingPatterns(commonAncestors);
  const bloodlineReinforcements = buildBloodlineReinforcements(linebreedingPatterns);
  const closeRelationshipWarnings = detectCloseRelationships(
    graph,
    mareRecord,
    stallionRecord,
    mareOccurrences,
    stallionOccurrences
  );

  const mareCompleteness = calculatePedigreeCompleteness(
    graph,
    marePedigreeId,
    BREEDING_MAX_GENERATIONS
  );
  const stallionCompleteness = calculatePedigreeCompleteness(
    graph,
    stallionPedigreeId,
    BREEDING_MAX_GENERATIONS
  );
  const dataConfidence = calculateDataConfidence(mareCompleteness, stallionCompleteness);

  const closest = getClosestCommonAncestor(commonAncestors);
  const closestDepth = closest
    ? closest.stallionSide.closestGeneration + closest.mareSide.closestGeneration
    : null;

  const report: BreedingAnalysisReport = {
    mare: graphRecordToPedigreeHorse(mareRecord),
    stallion: graphRecordToPedigreeHorse(stallionRecord),
    hypotheticalFoalTree: buildHypotheticalFoalTree(graph, marePedigreeId, stallionPedigreeId),
    dataConfidence,
    commonAncestors,
    linebreedingPatterns,
    closeRelationshipWarnings,
    bloodlineReinforcements,
    structureIndicators: {
      commonAncestorCount: commonAncestors.length,
      closestCommonAncestorDepth: closestDepth,
      closestCommonAncestorName: closest?.name ?? null,
      repeatedBloodlineCount: commonAncestors.filter((item) => item.isRepeated).length,
      closeRelationshipDetected: closeRelationshipWarnings.length > 0,
      linebreedingPatternCount: linebreedingPatterns.length,
    },
    analyzedGenerations: BREEDING_MAX_GENERATIONS,
    generatedAt: new Date().toISOString(),
  };

  return { report };
}

export async function analyzeBreedingCompare(
  supabase: SupabaseClient,
  marePedigreeId: string,
  stallionPedigreeIds: string[]
): Promise<{ reports: BreedingAnalysisReport[]; error?: string }> {
  const uniqueStallionIds = [...new Set(stallionPedigreeIds.filter(Boolean))].slice(0, 3);
  if (uniqueStallionIds.length === 0) {
    return { reports: [], error: "Select at least one stallion to compare." };
  }

  const graph = await loadPedigreeGraph(
    supabase,
    [marePedigreeId, ...uniqueStallionIds],
    BREEDING_MAX_GENERATIONS
  );

  const reports: BreedingAnalysisReport[] = [];

  for (const stallionId of uniqueStallionIds) {
    const { report, error } = await analyzeBreedingCross(
      supabase,
      marePedigreeId,
      stallionId,
      graph
    );
    if (error) {
      return { reports, error };
    }
    if (report) reports.push(report);
  }

  return { reports };
}
