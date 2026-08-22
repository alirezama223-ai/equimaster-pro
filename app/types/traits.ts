export const TRAIT_SCORE_MIN = 1;
export const TRAIT_SCORE_MAX = 5;

export type TraitCategoryKey =
  | "sport_performance"
  | "movement"
  | "conformation"
  | "temperament"
  | "breeding_commercial";

export type TraitKey =
  | "jumping_scope"
  | "jumping_technique"
  | "carefulness"
  | "rideability"
  | "speed"
  | "power"
  | "endurance"
  | "walk"
  | "trot"
  | "canter"
  | "balance"
  | "elasticity"
  | "frame"
  | "topline"
  | "leg_quality"
  | "hoof_quality"
  | "correctness"
  | "temperament"
  | "sensitivity"
  | "willingness"
  | "amateur_suitability"
  | "pedigree_strength"
  | "proven_performance"
  | "offspring_record"
  | "marketability";

export type TraitSourceType =
  | "owner_reported"
  | "breeder_reported"
  | "admin_assessed"
  | "verified_record"
  | "performance_data"
  | "offspring_data";

export type TraitAssessmentConfidence = "low" | "medium" | "high";

export type TraitProfileConfidenceLevel = "high" | "moderate" | "limited" | "insufficient_data";

export type TraitEvidenceNature = "subjective" | "objective" | "mixed";

export type TraitScoringGuidance = {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
};

export type TraitDefinition = {
  key: TraitKey;
  label: string;
  category: TraitCategoryKey;
  categoryLabel: string;
  description: string;
  scoringGuidance: TraitScoringGuidance;
  evidenceNature: TraitEvidenceNature;
  /** Documented allowed sources; enforcement varies by role (see RLS + server actions). */
  allowedSourceTypes: TraitSourceType[];
};

export type TraitEvidenceHistoryRow = {
  id: string;
  pedigreeHorseId: string;
  traitKey: TraitKey;
  traitLabel: string;
  score: number;
  confidence: TraitAssessmentConfidence;
  sourceType: TraitSourceType;
  sourceNote: string | null;
  verified: boolean;
  createdAt: string;
  canDelete: boolean;
};

export type HorseTraitAssessmentRow = {
  id: string;
  pedigree_horse_id: string;
  trait_key: string;
  score: number;
  confidence: TraitAssessmentConfidence;
  source_type: TraitSourceType;
  source_note: string | null;
  verified: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AggregatedTraitValue = {
  traitKey: TraitKey;
  label: string;
  category: TraitCategoryKey;
  categoryLabel: string;
  score: number | null;
  confidence: TraitProfileConfidenceLevel;
  evidenceCount: number;
  verifiedEvidenceCount: number;
  hasConflict: boolean;
  explanation: string;
  assessable: boolean;
};

export type HorseTraitProfile = {
  pedigreeHorseId: string;
  traits: AggregatedTraitValue[];
  strengths: AggregatedTraitValue[];
  improvementAreas: AggregatedTraitValue[];
  unknownTraits: AggregatedTraitValue[];
  overallConfidence: TraitProfileConfidenceLevel;
  disclaimer: string;
};

export type GoalPriority = "low" | "medium" | "high";

export type BreedingGoalEntry = {
  traitKey: TraitKey;
  priority: GoalPriority;
};

export type MareBreedingGoals = {
  marePedigreeId: string;
  improveGoals: BreedingGoalEntry[];
  preserveTraits: TraitKey[];
  avoidReinforcingWeaknesses: boolean;
};

export type ComplementStatus =
  | "strong_complement"
  | "complement"
  | "neutral"
  | "potential_concern"
  | "insufficient_data";

export type GoalTraitAnalysis = {
  traitKey: TraitKey;
  label: string;
  goalType: "improve" | "preserve";
  priority: GoalPriority;
  mareScore: number | null;
  mareConfidence: TraitProfileConfidenceLevel;
  stallionScore: number | null;
  stallionConfidence: TraitProfileConfidenceLevel;
  status: ComplementStatus;
  statusLabel: string;
  explanation: string;
  reinforcedWeakness: boolean;
  /** Transparent scoring diagnostics used to explain the final Goal Match Score. */
  priorityWeight?: number;
  statusPoints?: number;
  avgConfidenceMultiplier?: number;
  weightedContribution?: number;
  maxContribution?: number;
};

export type BreedingGoalAnalysisResult = {
  marePedigreeId: string;
  stallionPedigreeId: string;
  goalMatchScore: number | null;
  goalMatchScoreAvailable: boolean;
  goalMatchConfidence: TraitProfileConfidenceLevel;
  goalCoveragePercent: number;
  traitAnalyses: GoalTraitAnalysis[];
  strongComplements: string[];
  strengthsPreserved: string[];
  potentialConcerns: string[];
  unknowns: string[];
  reinforcedWeaknesses: string[];
  mareSummary: {
    strengths: string[];
    improvementAreas: string[];
    unknowns: string[];
  };
  disclaimer: string;
};

export type GoalMatchSortOption = "best_goal_match" | "name";
