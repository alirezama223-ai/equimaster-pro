"use client";

import { buildScoreBreakdownNotes } from "@/app/lib/breeding-recommendations/explanations";
import { StallionRecommendationResult } from "@/app/types/breeding-recommendations";

type Props = {
  result: StallionRecommendationResult;
};

function formatDimensionScore(
  value: number | null,
  max: number,
  scoreAvailable: boolean
): string {
  if (!scoreAvailable || value === null) {
    return "Not reliably assessable";
  }
  return `${value} / ${max}`;
}

export default function RecommendationScoreBreakdownPanel({ result }: Props) {
  const { scoreBreakdown, report } = result;
  const notes = buildScoreBreakdownNotes(report, scoreBreakdown);

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-[#08111F] p-4 text-sm">
      <p className="font-semibold text-white">Score breakdown</p>
      <dl className="mt-3 space-y-2 text-gray-300">
        <div className="flex justify-between gap-4">
          <dt>Close relationship safety</dt>
          <dd>
            {formatDimensionScore(
              scoreBreakdown.closeRelationshipSafety,
              scoreBreakdown.maxCloseRelationshipSafety,
              scoreBreakdown.scoreAvailable
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Pedigree concentration</dt>
          <dd>
            {formatDimensionScore(
              scoreBreakdown.pedigreeConcentration,
              scoreBreakdown.maxPedigreeConcentration,
              scoreBreakdown.scoreAvailable
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Data confidence</dt>
          <dd>
            {scoreBreakdown.dataConfidence} / {scoreBreakdown.maxDataConfidence}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Pedigree diversity</dt>
          <dd>
            {formatDimensionScore(
              scoreBreakdown.pedigreeDiversity,
              scoreBreakdown.maxPedigreeDiversity,
              scoreBreakdown.scoreAvailable
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-white/10 pt-2 font-semibold text-white">
          <dt>TOTAL</dt>
          <dd>{scoreBreakdown.scoreAvailable ? `${scoreBreakdown.total} / 100` : "Insufficient Data"}</dd>
        </div>
      </dl>
      <ul className="mt-4 space-y-2 text-xs text-gray-400">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
