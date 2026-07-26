import { SEVERITY_LABELS } from "@/app/lib/breeding/constants";
import {
  CommonAncestorResult,
  LinebreedingPattern,
  LinebreedingSeverity,
} from "@/app/types/breeding";

export function linebreedingNotation(stallionGeneration: number, mareGeneration: number): string {
  return `${stallionGeneration}×${mareGeneration}`;
}

export function classifyLinebreedingSeverity(
  stallionGeneration: number,
  mareGeneration: number
): LinebreedingSeverity {
  const closest = Math.min(stallionGeneration, mareGeneration);
  const combined = stallionGeneration + mareGeneration;

  if (closest <= 2 || combined <= 4) return "very_close";
  if (closest <= 3 || combined <= 6) return "close";
  if (closest <= 4 || combined <= 8) return "moderate";
  return "distant";
}

export function buildLinebreedingPatterns(
  commonAncestors: CommonAncestorResult[]
): LinebreedingPattern[] {
  const patterns: LinebreedingPattern[] = [];

  for (const ancestor of commonAncestors) {
    const stallionGenerations = ancestor.stallionSide.generations;
    const mareGenerations = ancestor.mareSide.generations;
    const seen = new Set<string>();

    for (const stallionGeneration of stallionGenerations) {
      for (const mareGeneration of mareGenerations) {
        const key = `${stallionGeneration}-${mareGeneration}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const severity = classifyLinebreedingSeverity(stallionGeneration, mareGeneration);
        patterns.push({
          ancestorId: ancestor.ancestorId,
          name: ancestor.name,
          verified: ancestor.verified,
          stallionGeneration,
          mareGeneration,
          notation: linebreedingNotation(stallionGeneration, mareGeneration),
          severity,
          severityLabel: SEVERITY_LABELS[severity],
        });
      }
    }
  }

  const severityOrder: Record<LinebreedingSeverity, number> = {
    very_close: 0,
    close: 1,
    moderate: 2,
    distant: 3,
  };

  return patterns.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    const depthDiff = a.stallionGeneration + a.mareGeneration - (b.stallionGeneration + b.mareGeneration);
    if (depthDiff !== 0) return depthDiff;
    return a.name.localeCompare(b.name);
  });
}

export function buildBloodlineReinforcements(
  linebreedingPatterns: LinebreedingPattern[]
): import("@/app/types/breeding").BloodlineReinforcement[] {
  const byAncestor = new Map<string, LinebreedingPattern>();

  for (const pattern of linebreedingPatterns) {
    const existing = byAncestor.get(pattern.ancestorId);
    if (!existing) {
      byAncestor.set(pattern.ancestorId, pattern);
      continue;
    }

    const existingRank = severityRank(existing.severity);
    const nextRank = severityRank(pattern.severity);
    if (nextRank < existingRank) {
      byAncestor.set(pattern.ancestorId, pattern);
    }
  }

  return [...byAncestor.values()]
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .map((pattern) => ({
      ancestorId: pattern.ancestorId,
      name: pattern.name,
      verified: pattern.verified,
      notation: pattern.notation,
      stallionGeneration: pattern.stallionGeneration,
      mareGeneration: pattern.mareGeneration,
      severity: pattern.severity,
      severityLabel: pattern.severityLabel,
    }));
}

function severityRank(severity: LinebreedingSeverity): number {
  switch (severity) {
    case "very_close":
      return 0;
    case "close":
      return 1;
    case "moderate":
      return 2;
    default:
      return 3;
  }
}
