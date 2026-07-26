import { describe, expect, it } from "vitest";
import { buildHorseTraitProfile } from "@/app/lib/traits/aggregate";
import { analyzeBreedingGoalsCross } from "@/app/lib/breeding-goals/analyze";
import {
  getAllowedAdminSourceTypesForTrait,
  validateAdminSourceForTrait,
  validateEditableSourceForTrait,
} from "@/app/lib/traits/validation";
import { HorseTraitAssessmentRow, MareBreedingGoals } from "@/app/types/traits";

function row(
  traitKey: string,
  score: number,
  sourceType: HorseTraitAssessmentRow["source_type"],
  confidence: HorseTraitAssessmentRow["confidence"] = "high",
  verified = false
): HorseTraitAssessmentRow {
  return {
    id: `${traitKey}-${sourceType}-${score}-${verified}`,
    pedigree_horse_id: "horse-a",
    trait_key: traitKey,
    score,
    confidence,
    source_type: sourceType,
    source_note: null,
    verified,
    created_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("phase 13 admin evidence validation", () => {
  it("restricts admin create sources to admin-only types per trait catalog", () => {
    expect(getAllowedAdminSourceTypesForTrait("jumping_scope")).toEqual([
      "admin_assessed",
      "verified_record",
      "performance_data",
      "offspring_data",
    ]);
    expect(validateAdminSourceForTrait("jumping_scope", "admin_assessed")).toBeNull();
    expect(validateAdminSourceForTrait("jumping_scope", "owner_reported")).toMatch(/not permitted/);
  });

  it("allows admin edit to retain manager source types on existing rows", () => {
    expect(validateEditableSourceForTrait("rideability", "owner_reported")).toBeNull();
  });

  it("weights admin_assessed higher than owner_reported in aggregation", () => {
    const adminProfile = buildHorseTraitProfile("stallion-id", [
      row("jumping_scope", 4, "admin_assessed", "high"),
    ]);
    const ownerProfile = buildHorseTraitProfile("stallion-id", [
      row("jumping_scope", 4, "owner_reported", "high"),
    ]);
    const adminTrait = adminProfile.traits.find((item) => item.traitKey === "jumping_scope");
    const ownerTrait = ownerProfile.traits.find((item) => item.traitKey === "jumping_scope");
    expect(adminTrait?.assessable).toBe(true);
    expect(ownerTrait?.assessable).toBe(false);
  });
});

describe("phase 13 pedigree vs goal independence", () => {
  const goals: MareBreedingGoals = {
    marePedigreeId: "mare-id",
    improveGoals: [{ traitKey: "jumping_scope", priority: "high" }],
    preserveTraits: [],
    avoidReinforcingWeaknesses: true,
  };

  it("H: trait evidence sufficient allows goal analysis even when pedigree is separate", () => {
    const mare = buildHorseTraitProfile("mare-id", [row("jumping_scope", 3, "admin_assessed")]);
    const stallion = buildHorseTraitProfile("stallion-id", [row("jumping_scope", 4.5, "admin_assessed")]);
    const result = analyzeBreedingGoalsCross(mare, stallion, goals);
    expect(result.goalMatchScoreAvailable).toBe(true);
  });

  it("I: insufficient trait evidence yields insufficient goal match", () => {
    const mare = buildHorseTraitProfile("mare-id", []);
    const stallion = buildHorseTraitProfile("stallion-id", [row("jumping_scope", 4.5, "admin_assessed")]);
    const result = analyzeBreedingGoalsCross(mare, stallion, goals);
    expect(result.goalMatchScoreAvailable).toBe(false);
  });
});
