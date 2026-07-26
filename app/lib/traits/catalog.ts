import {
  TraitCategoryKey,
  TraitDefinition,
  TraitEvidenceNature,
  TraitKey,
  TraitSourceType,
} from "@/app/types/traits";

const STANDARD_FIVE_POINT_GUIDANCE: TraitDefinition["scoringGuidance"] = {
  1: "Clearly limited based on available evidence",
  2: "Below average in available evidence",
  3: "Average / adequate in available evidence",
  4: "Strong in available evidence",
  5: "Exceptional in available evidence",
};

const REPORTED_SOURCES: TraitSourceType[] = ["owner_reported", "breeder_reported"];
const ALL_EVIDENCE_SOURCES: TraitSourceType[] = [
  "owner_reported",
  "breeder_reported",
  "admin_assessed",
  "verified_record",
  "performance_data",
  "offspring_data",
];

function def(
  key: TraitKey,
  label: string,
  category: TraitCategoryKey,
  categoryLabel: string,
  description: string,
  evidenceNature: TraitEvidenceNature,
  allowedSourceTypes: TraitSourceType[],
  scoringGuidance: TraitDefinition["scoringGuidance"] = STANDARD_FIVE_POINT_GUIDANCE
): TraitDefinition {
  return {
    key,
    label,
    category,
    categoryLabel,
    description,
    evidenceNature,
    allowedSourceTypes,
    scoringGuidance,
  };
}

/**
 * Canonical trait registry — single source of truth for labels, categories, and scoring guidance.
 * Keys must remain stable for Phase 11 aggregation and goal scoring.
 */
export const TRAIT_CATALOG: TraitDefinition[] = [
  def(
    "jumping_scope",
    "Jumping scope",
    "sport_performance",
    "Sport / Performance",
    "Capacity and scope over fences based on structured evidence (not a guarantee of offspring outcome).",
    "mixed",
    ALL_EVIDENCE_SOURCES,
    {
      1: "Clearly limited scope in available evidence",
      2: "Below-average scope",
      3: "Average / adequate scope",
      4: "Strong scope",
      5: "Exceptional scope in available evidence",
    }
  ),
  def(
    "jumping_technique",
    "Jumping technique",
    "sport_performance",
    "Sport / Performance",
    "Quality of jumping form and technique in available structured evidence.",
    "subjective",
    ALL_EVIDENCE_SOURCES
  ),
  def(
    "carefulness",
    "Carefulness",
    "sport_performance",
    "Sport / Performance",
    "Responsiveness, carefulness, and respect toward fences in available evidence.",
    "subjective",
    ALL_EVIDENCE_SOURCES
  ),
  def(
    "rideability",
    "Rideability",
    "sport_performance",
    "Sport / Performance",
    "Ease of ride and adjustability for the rider in available evidence.",
    "subjective",
    ALL_EVIDENCE_SOURCES
  ),
  def(
    "speed",
    "Speed",
    "sport_performance",
    "Sport / Performance",
    "Pace, quickness, and time-related performance indicators in available evidence.",
    "mixed",
    ALL_EVIDENCE_SOURCES
  ),
  def(
    "power",
    "Power",
    "sport_performance",
    "Sport / Performance",
    "Strength and power expression in sport or training contexts.",
    "subjective",
    ALL_EVIDENCE_SOURCES
  ),
  def(
    "endurance",
    "Endurance",
    "sport_performance",
    "Sport / Performance",
    "Stamina and sustained effort capacity in available evidence.",
    "mixed",
    ALL_EVIDENCE_SOURCES
  ),
  def("walk", "Walk", "movement", "Movement", "Quality of the walk in available evidence.", "subjective", ALL_EVIDENCE_SOURCES),
  def("trot", "Trot", "movement", "Movement", "Quality of the trot in available evidence.", "subjective", ALL_EVIDENCE_SOURCES),
  def("canter", "Canter", "movement", "Movement", "Quality of the canter in available evidence.", "subjective", ALL_EVIDENCE_SOURCES),
  def("balance", "Balance", "movement", "Movement", "Balance and self-carriage in available evidence.", "subjective", ALL_EVIDENCE_SOURCES),
  def("elasticity", "Elasticity", "movement", "Movement", "Elasticity and suppleness in available evidence.", "subjective", ALL_EVIDENCE_SOURCES),
  def("frame", "Frame", "conformation", "Conformation", "Overall frame and proportions in available evidence.", "subjective", REPORTED_SOURCES),
  def("topline", "Topline", "conformation", "Conformation", "Topline quality in available evidence.", "subjective", REPORTED_SOURCES),
  def("leg_quality", "Leg quality", "conformation", "Conformation", "Leg conformation and quality in available evidence.", "subjective", REPORTED_SOURCES),
  def("hoof_quality", "Hoof quality", "conformation", "Conformation", "Hoof quality in available evidence.", "subjective", REPORTED_SOURCES),
  def("correctness", "Correctness", "conformation", "Conformation", "General correctness of conformation in available evidence.", "subjective", REPORTED_SOURCES),
  def("temperament", "Temperament", "temperament", "Temperament / Reliability", "General temperament in handling and work.", "subjective", REPORTED_SOURCES),
  def("sensitivity", "Sensitivity", "temperament", "Temperament / Reliability", "Sensitivity and reactivity in available evidence.", "subjective", REPORTED_SOURCES),
  def("willingness", "Willingness", "temperament", "Temperament / Reliability", "Cooperation and willingness in available evidence.", "subjective", REPORTED_SOURCES),
  def(
    "amateur_suitability",
    "Amateur suitability",
    "temperament",
    "Temperament / Reliability",
    "Suitability for amateur riders in available evidence.",
    "subjective",
    REPORTED_SOURCES
  ),
  def(
    "pedigree_strength",
    "Pedigree strength",
    "breeding_commercial",
    "Breeding / Commercial",
    "Commercial or bloodline strength context. Not inferred automatically from pedigree graph alone.",
    "mixed",
    ["admin_assessed", "verified_record", "offspring_data"]
  ),
  def(
    "proven_performance",
    "Proven performance",
    "breeding_commercial",
    "Breeding / Commercial",
    "Documented performance record strength.",
    "objective",
    ["verified_record", "performance_data", "admin_assessed"]
  ),
  def(
    "offspring_record",
    "Offspring record",
    "breeding_commercial",
    "Breeding / Commercial",
    "Quality and consistency of offspring/progeny evidence.",
    "objective",
    ["offspring_data", "verified_record", "admin_assessed"]
  ),
  def(
    "marketability",
    "Marketability",
    "breeding_commercial",
    "Breeding / Commercial",
    "Commercial appeal and market positioning in available evidence.",
    "mixed",
    ["admin_assessed", "verified_record", "breeder_reported"]
  ),
];

export const TRAIT_CATALOG_MAP = new Map<TraitKey, TraitDefinition>(
  TRAIT_CATALOG.map((item) => [item.key, item])
);

export function getTraitCatalogEntry(key: TraitKey): TraitDefinition {
  return TRAIT_CATALOG_MAP.get(key)!;
}

export function getTraitsByCategoryFromCatalog() {
  const grouped = new Map<string, TraitDefinition[]>();
  for (const trait of TRAIT_CATALOG) {
    const list = grouped.get(trait.category) ?? [];
    list.push(trait);
    grouped.set(trait.category, list);
  }
  return grouped;
}
