import { describe, expect, it } from "vitest";
import { buildHorseTraitProfile } from "@/app/lib/traits/aggregate";
import { analyzeBreedingGoalsCross } from "@/app/lib/breeding-goals/analyze";
import { HorseTraitAssessmentRow, MareBreedingGoals } from "@/app/types/traits";

function row(
  traitKey: string,
  score: number,
  sourceType: HorseTraitAssessmentRow["source_type"],
  confidence: HorseTraitAssessmentRow["confidence"] = "high",
  verified = false
): HorseTraitAssessmentRow {
  return {
    id: `${traitKey}-${sourceType}-${score}`,
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

describe("trait aggregation", () => {
  it("returns insufficient data when no evidence exists", () => {
    const profile = buildHorseTraitProfile("mare-id", []);
    const jumping = profile.traits.find((item) => item.traitKey === "jumping_scope");
    expect(jumping?.assessable).toBe(false);
    expect(jumping?.score).toBeNull();
  });

  it("assesses unverified admin_assessed high-confidence evidence", () => {
    const profile = buildHorseTraitProfile("stallion-id", [
      row("jumping_scope", 4.5, "admin_assessed", "high", false),
    ]);
    const trait = profile.traits.find((item) => item.traitKey === "jumping_scope");
    expect(trait?.assessable).toBe(true);
    expect(trait?.score).toBe(4.5);
    expect(trait?.confidence).toBe("limited");
  });

  it("weights verified evidence higher than unverified owner-reported in mixed aggregation", () => {
    const mixed = buildHorseTraitProfile("stallion-id", [
      row("speed", 2, "owner_reported", "high", false),
      row("speed", 5, "verified_record", "high", true),
    ]);
    const ownerOnly = buildHorseTraitProfile("stallion-id", [
      row("speed", 2, "owner_reported", "high", false),
      row("speed", 2, "owner_reported", "high", false),
    ]);
    const mixedTrait = mixed.traits.find((item) => item.traitKey === "speed");
    const ownerTrait = ownerOnly.traits.find((item) => item.traitKey === "speed");
    expect(mixedTrait?.assessable).toBe(true);
    expect(ownerTrait?.assessable).toBe(true);
    expect(mixedTrait!.score!).toBeGreaterThan(ownerTrait!.score!);
  });

  it("aggregates multiple sources deterministically without duplicate amplification", () => {
    const profile = buildHorseTraitProfile("stallion-id", [
      row("jumping_scope", 4.5, "owner_reported", "high"),
      row("jumping_scope", 4.0, "breeder_reported", "high"),
      row("jumping_scope", 4.2, "verified_record", "high", true),
    ]);
    const trait = profile.traits.find((item) => item.traitKey === "jumping_scope");
    expect(trait?.assessable).toBe(true);
    expect(trait?.score).toBeGreaterThan(4);
    expect(trait?.score).toBeLessThan(4.5);
    expect(trait?.evidenceCount).toBe(3);
  });
});

describe("goal-based cross analysis", () => {
  const goals: MareBreedingGoals = {
    marePedigreeId: "mare-id",
    improveGoals: [
      { traitKey: "jumping_scope", priority: "high" },
      { traitKey: "speed", priority: "high" },
      { traitKey: "carefulness", priority: "high" },
    ],
    preserveTraits: [],
    avoidReinforcingWeaknesses: true,
  };

  it("A/B/C: insufficient cross evidence when one or both sides missing", () => {
    const mareOnly = buildHorseTraitProfile("mare-id", [row("jumping_scope", 3, "admin_assessed")]);
    const stallionOnly = buildHorseTraitProfile("stallion-id", [row("jumping_scope", 4.5, "admin_assessed")]);
    const none = buildHorseTraitProfile("empty-id", []);

    const mareOnlyResult = analyzeBreedingGoalsCross(mareOnly, none, goals);
    expect(mareOnlyResult.goalMatchScoreAvailable).toBe(false);
    expect(mareOnlyResult.goalCoveragePercent).toBe(0);

    const stallionOnlyResult = analyzeBreedingGoalsCross(none, stallionOnly, goals);
    expect(stallionOnlyResult.goalMatchScoreAvailable).toBe(false);

    const oneSide = analyzeBreedingGoalsCross(mareOnly, stallionOnly, goals);
    expect(oneSide.goalMatchScoreAvailable).toBe(false);
    expect(oneSide.unknowns.length).toBeGreaterThan(0);
  });

  it("D/E: both sides sufficient yields assessable goal match and complements", () => {
    const mare = buildHorseTraitProfile("mare-id", [
      row("jumping_scope", 3, "admin_assessed"),
      row("speed", 3.5, "admin_assessed"),
      row("carefulness", 3, "admin_assessed"),
    ]);
    const stallion = buildHorseTraitProfile("stallion-id", [
      row("jumping_scope", 4.5, "admin_assessed"),
      row("speed", 3, "admin_assessed"),
      row("carefulness", 3.5, "admin_assessed"),
    ]);

    const result = analyzeBreedingGoalsCross(mare, stallion, goals);
    expect(result.goalMatchScoreAvailable).toBe(true);
    expect(result.goalMatchScore).not.toBeNull();
    expect(result.strongComplements).toContain("Jumping scope");
  });

  it("F: reinforced weakness marks concern", () => {
    const mare = buildHorseTraitProfile("mare-id", [row("speed", 2, "admin_assessed")]);
    const stallion = buildHorseTraitProfile("stallion-id", [row("speed", 2, "admin_assessed")]);
    const speedGoals: MareBreedingGoals = {
      marePedigreeId: "mare-id",
      improveGoals: [{ traitKey: "speed", priority: "high" }],
      preserveTraits: [],
      avoidReinforcingWeaknesses: true,
    };
    const result = analyzeBreedingGoalsCross(mare, stallion, speedGoals);
    expect(result.potentialConcerns).toContain("Speed");
  });
});
