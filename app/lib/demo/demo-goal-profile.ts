import type { HorseTraitAssessmentRow, TraitKey } from "@/app/types/traits";
import { TRAIT_CATALOG } from "@/app/lib/traits/catalog";

const DEMO_SCORES: Record<string, Record<string, number>> = {
  Bella: { jumping_scope: 3, jumping_technique: 3, carefulness: 3, rideability: 4, temperament: 4 },
  "SHABDIZ Demo Alpha": { jumping_scope: 5, jumping_technique: 4, carefulness: 4, rideability: 3, temperament: 3 },
  "SHABDIZ Demo Bravo": { jumping_scope: 4, jumping_technique: 5, carefulness: 5, rideability: 4, temperament: 4 },
  "SHABDIZ Demo Charlie": { jumping_scope: 3, jumping_technique: 4, carefulness: 3, rideability: 5, temperament: 5 },
  "SHABDIZ Demo Delta": { jumping_scope: 5, jumping_technique: 3, carefulness: 4, rideability: 2, temperament: 2 },
  "SHABDIZ Demo Echo": { jumping_scope: 4, jumping_technique: 4, carefulness: 4, rideability: 4, temperament: 5 },
};

export function isShabdizDemoHorseName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return normalized === "bella" || name.trim().startsWith("SHABDIZ Demo ");
}

export function createDemoGoalEvidence(
  pedigreeHorseId: string,
  horseName: string,
  selectedTraitKeys?: Iterable<string>
): HorseTraitAssessmentRow[] {
  const preset = DEMO_SCORES[horseName];
  if (!preset) return [];
  const selected = selectedTraitKeys ? new Set(selectedTraitKeys) : null;
  const now = new Date().toISOString();

  return TRAIT_CATALOG
    .filter((trait) => !selected || selected.has(trait.key))
    .filter((trait) => trait.allowedSourceTypes.includes("owner_reported") && trait.allowedSourceTypes.includes("breeder_reported"))
    .flatMap((trait) => {
      const score = preset[trait.key] ?? 3;
      const base = {
        pedigree_horse_id: pedigreeHorseId,
        trait_key: trait.key as TraitKey,
        score,
        confidence: "high" as const,
        source_note: "Synthetic SHABDIZ demo evidence used only in Demo/Test Mode.",
        verified: false,
        created_by: null,
        created_at: now,
        updated_at: now,
      };
      return [
        { id: `demo-${pedigreeHorseId}-${trait.key}-owner`, ...base, source_type: "owner_reported" as const },
        { id: `demo-${pedigreeHorseId}-${trait.key}-breeder`, ...base, source_type: "breeder_reported" as const },
      ];
    });
}
