import { PedigreeHorse, PedigreeSex, PedigreeTreeNode } from "@/app/types/pedigree";

export type BreedingPedigreeSide = "stallion" | "mare";

export type BreedingCandidate = {
  id: string;
  name: string;
  sex: PedigreeSex;
  birthYear: number | null;
  studbook: string | null;
  registrationNumber: string | null;
  sireName: string | null;
  damSireName: string | null;
  verified: boolean;
  source: "pedigree" | "stallion_directory" | "listing";
  sourceId: string | null;
};

export type AncestorPathStep = "sire" | "dam";

export type AncestorOccurrence = {
  ancestorId: string;
  generation: number;
  path: AncestorPathStep[];
  side: BreedingPedigreeSide;
};

export type LoadedPedigreeRecord = {
  id: string;
  name: string;
  sex: PedigreeSex;
  birthYear: number | null;
  studbook: string | null;
  registrationNumber: string | null;
  verified: boolean;
  sireId: string | null;
  damId: string | null;
};

export type PedigreeGraph = Map<string, LoadedPedigreeRecord>;

export type SideOccurrenceSummary = {
  side: BreedingPedigreeSide;
  closestGeneration: number;
  generations: number[];
  occurrenceCount: number;
  paths: AncestorPathStep[][];
};

export type CommonAncestorResult = {
  ancestorId: string;
  name: string;
  verified: boolean;
  stallionSide: SideOccurrenceSummary;
  mareSide: SideOccurrenceSummary;
  isRepeated: boolean;
};

export type LinebreedingSeverity = "very_close" | "close" | "moderate" | "distant";

export type LinebreedingPattern = {
  ancestorId: string;
  name: string;
  verified: boolean;
  stallionGeneration: number;
  mareGeneration: number;
  notation: string;
  severity: LinebreedingSeverity;
  severityLabel: string;
};

export type CloseRelationshipKind =
  | "same_horse"
  | "parent_offspring"
  | "full_sibling"
  | "half_sibling"
  | "grandparent_grandoffspring"
  | "direct_ancestor_descendant";

export type CloseRelationshipWarning = {
  kind: CloseRelationshipKind;
  title: string;
  explanation: string;
  severity: "critical" | "high";
};

export type PedigreeCompletenessMetrics = {
  analyzedGenerations: number;
  expectedAncestorSlots: number;
  knownAncestorSlots: number;
  completenessPercent: number;
  verifiedAncestorCount: number;
  verifiedAncestorPercent: number;
};

export type DataConfidenceLevel = "high" | "moderate" | "limited";

export type DataConfidence = {
  level: DataConfidenceLevel;
  label: string;
  explanation: string;
  mareCompleteness: PedigreeCompletenessMetrics;
  stallionCompleteness: PedigreeCompletenessMetrics;
};

export type BloodlineReinforcement = {
  ancestorId: string;
  name: string;
  verified: boolean;
  notation: string;
  stallionGeneration: number;
  mareGeneration: number;
  severity: LinebreedingSeverity;
  severityLabel: string;
};

export type BreedingStructureIndicators = {
  commonAncestorCount: number;
  closestCommonAncestorDepth: number | null;
  closestCommonAncestorName: string | null;
  repeatedBloodlineCount: number;
  closeRelationshipDetected: boolean;
  linebreedingPatternCount: number;
};

export type BreedingAnalysisReport = {
  mare: PedigreeHorse;
  stallion: PedigreeHorse;
  hypotheticalFoalTree: PedigreeTreeNode;
  dataConfidence: DataConfidence;
  commonAncestors: CommonAncestorResult[];
  linebreedingPatterns: LinebreedingPattern[];
  closeRelationshipWarnings: CloseRelationshipWarning[];
  bloodlineReinforcements: BloodlineReinforcement[];
  structureIndicators: BreedingStructureIndicators;
  analyzedGenerations: number;
  generatedAt: string;
};

export type BreedingCompareSummary = {
  stallion: PedigreeHorse;
  report: BreedingAnalysisReport;
};

export type SavedBreedingAnalysis = {
  id: string;
  title: string | null;
  marePedigreeId: string;
  stallionPedigreeId: string;
  mareName: string;
  stallionName: string;
  createdAt: string;
  updatedAt: string;
};
