import { BreedingAnalysisReport, BreedingCandidate } from "@/app/types/breeding";

import { StallionAvailability } from "@/app/types/stallion";



export type RecommendationRiskLevel =

  | "low_concern"

  | "review"

  | "high_concern"

  | "insufficient_data";



export type RecommendationConfidenceLevel = "high" | "moderate" | "limited";



export type RecommendationSortOption =

  | "best_match"

  | "highest_confidence"

  | "lowest_stud_fee"

  | "name";



export type MinimumPedigreeConfidenceFilter = "any" | "moderate" | "high";



export type StallionRecommendationFilters = {

  discipline?: string;

  studbook?: string;

  country?: string;

  maxStudFee?: number | null;

  studFeeCurrency?: string;

  breedingMethods?: string[];

  includeUnavailable?: boolean;

  minimumPedigreeConfidence?: MinimumPedigreeConfidenceFilter;

};



export type StallionRecommendationCandidate = {

  stallionDirectoryId: string;

  pedigreeHorseId: string;

  name: string;

  breed: string;

  studbook: string | null;

  birthYear: number | null;

  country: string;

  discipline: string;

  studFee: number | null;

  studFeeCurrency: string;

  studFeeLabel: string;

  availability: StallionAvailability;

  coverImageUrl: string;

  verified: boolean;

  breedingMethods: string[];

};



export type RecommendationScoreBreakdown = {

  scoreAvailable: boolean;

  pairCoveragePercent: number;

  evidenceFactor: number | null;

  rawCloseRelationshipSafety?: number;

  rawPedigreeConcentration?: number;

  rawPedigreeDiversity?: number;

  closeRelationshipSafety: number | null;

  pedigreeConcentration: number | null;

  dataConfidence: number;

  pedigreeDiversity: number | null;

  total: number | null;

  maxCloseRelationshipSafety: number;

  maxPedigreeConcentration: number;

  maxDataConfidence: number;

  maxPedigreeDiversity: number;

};



export type StallionRecommendationResult = {

  rank: number;

  candidate: StallionRecommendationCandidate;

  compatibilityScore: number | null;

  scoreLabel: string;

  riskLevel: RecommendationRiskLevel;

  riskLabel: string;

  analysisConfidence: RecommendationConfidenceLevel;

  analysisConfidenceLabel: string;

  scoreBreakdown: RecommendationScoreBreakdown;

  reasons: string[];

  warnings: string[];

  report: BreedingAnalysisReport;

};



export type StallionRecommendationResponse = {

  mare: BreedingCandidate;

  mareCompletenessPercent: number;

  analyzedCount: number;

  eligiblePoolCount: number;

  results: StallionRecommendationResult[];

  disclaimer: string;

};


