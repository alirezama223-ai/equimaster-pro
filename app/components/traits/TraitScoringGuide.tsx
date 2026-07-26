"use client";

import { getTraitDefinition } from "@/app/lib/traits/constants";
import { TraitKey } from "@/app/types/traits";

type Props = {
  traitKey: TraitKey;
};

export default function TraitScoringGuide({ traitKey }: Props) {
  const trait = getTraitDefinition(traitKey);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
      <p className="text-sm font-semibold text-white">{trait.label}</p>
      <p className="mt-2 text-sm text-gray-400">{trait.description}</p>
      <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">
        Scoring guidance (structured assessment — not a scientific guarantee)
      </p>
      <ul className="mt-2 space-y-1 text-sm text-gray-300">
        {([1, 2, 3, 4, 5] as const).map((score) => (
          <li key={score}>
            <span className="font-semibold text-blue-400">{score}/5</span> — {trait.scoringGuidance[score]}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-gray-500">
        Evidence nature: {trait.evidenceNature}. Allowed sources for this trait include documented
        categories such as owner/breeder reports and admin-reviewed records.
      </p>
    </div>
  );
}
