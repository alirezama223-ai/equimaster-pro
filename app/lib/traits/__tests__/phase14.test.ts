import { describe, expect, it } from "vitest";
import { buildHorseTraitProfile } from "@/app/lib/traits/aggregate";
import { analyzeBreedingGoalsCross } from "@/app/lib/breeding-goals/analyze";
import { HorseTraitAssessmentRow, MareBreedingGoals } from "@/app/types/traits";

function row(
  pedigreeHorseId: string,
  traitKey: string,
  score: number,
  confidence: HorseTraitAssessmentRow["confidence"] = "high"
): HorseTraitAssessmentRow {
  return {
    id: `${pedigreeHorseId}-${traitKey}-${score}`,
    pedigree_horse_id: pedigreeHorseId,
    trait_key: traitKey,
    score,
    confidence,
    source_type: "verified_record",
    source_note: null,
    verified: false,
    created_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("phase 14 evidence-driven breeding goal score", () => {
  it("matches the transparent 75/100 example shown by the goal contributions", () => {
    const mare = buildHorseTraitProfile("mare-id", [
      row("mare-id", "jumping_scope", 3.7),
      row("mare-id", "jumping_technique", 2.3),
      row("mare-id", "carefulness", 3),
    ]);
    const stallion = buildHorseTraitProfile("stallion-id", [
      row("stallion-id", "jumping_scope", 4.7),
      row("stallion-id", "jumping_technique", 3.3),
      row("stallion-id", "carefulness", 4),
    ]);

    const goals: MareBreedingGoals = {
      marePedigreeId: "mare-id",
      improveGoals: [
        { traitKey: "jumping_scope", priority: "high" },
        { traitKey: "jumping_technique", priority: "high" },
      ],
      preserveTraits: ["carefulness"],
      avoidReinforcingWeaknesses: true,
    };

    const result = analyzeBreedingGoalsCross(mare, stallion, goals);

    expect(result.goalCoveragePercent).toBe(100);
    expect(result.goalMatchScoreAvailable).toBe(true);
    expect(result.goalMatchScore).toBe(75);
    expect(result.traitAnalyses.map((item) => item.weightedContribution)).toEqual([240, 240, 120]);
    expect(result.traitAnalyses.map((item) => item.maxContribution)).toEqual([300, 300, 200]);
  });

  it("uses the weaker horse for preserve goals", () => {
    const mare = buildHorseTraitProfile("mare-id", [row("mare-id", "carefulness", 3)]);
    const stallion = buildHorseTraitProfile("stallion-id", [row("stallion-id", "carefulness", 4.5)]);
    const goals: MareBreedingGoals = {
      marePedigreeId: "mare-id",
      improveGoals: [],
      preserveTraits: ["carefulness"],
      avoidReinforcingWeaknesses: true,
    };

    const result = analyzeBreedingGoalsCross(mare, stallion, goals);
    expect(result.goalMatchScore).toBe(60);
    expect(result.traitAnalyses[0].statusPoints).toBe(60);
  });

  it("reduces an improvement goal when the stallion is not stronger", () => {
    const mare = buildHorseTraitProfile("mare-id", [row("mare-id", "jumping_scope", 4)]);
    const stallion = buildHorseTraitProfile("stallion-id", [row("stallion-id", "jumping_scope", 3)]);
    const goals: MareBreedingGoals = {
      marePedigreeId: "mare-id",
      improveGoals: [{ traitKey: "jumping_scope", priority: "high" }],
      preserveTraits: [],
      avoidReinforcingWeaknesses: true,
    };

    const result = analyzeBreedingGoalsCross(mare, stallion, goals);
    expect(result.goalMatchScore).toBe(20);
    expect(result.traitAnalyses[0].status).toBe("potential_concern");
  });
});
