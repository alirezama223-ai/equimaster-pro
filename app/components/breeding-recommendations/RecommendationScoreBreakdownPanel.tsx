"use client";

import { useTranslations } from "next-intl";
import { buildScoreBreakdownNotes } from "@/app/lib/breeding-recommendations/explanations";
import { StallionRecommendationResult } from "@/app/types/breeding-recommendations";

type Props = {
  result: StallionRecommendationResult;
};

function formatDimensionScore(
  t: ReturnType<typeof useTranslations>,
  value: number | null,
  max: number,
  scoreAvailable: boolean
): string {
  if (!scoreAvailable || value === null) {
    return t("recommendations.notReliablyAssessable");
  }
  return t("recommendations.scoreFraction", { value, max });
}

export default function RecommendationScoreBreakdownPanel({ result }: Props) {
  const t = useTranslations("breeding");
  const { scoreBreakdown, report } = result;
  const notes = buildScoreBreakdownNotes(report, scoreBreakdown);

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-[#08111F] p-4 text-sm">
      <p className="font-semibold text-white">{t("recommendations.scoreBreakdownTitle")}</p>
      <dl className="mt-3 space-y-2 text-gray-300">
        <div className="flex justify-between gap-4">
          <dt>{t("recommendations.closeRelationshipSafety")}</dt>
          <dd>
            {formatDimensionScore(
              t,
              scoreBreakdown.closeRelationshipSafety,
              scoreBreakdown.maxCloseRelationshipSafety,
              scoreBreakdown.scoreAvailable
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{t("recommendations.pedigreeConcentration")}</dt>
          <dd>
            {formatDimensionScore(
              t,
              scoreBreakdown.pedigreeConcentration,
              scoreBreakdown.maxPedigreeConcentration,
              scoreBreakdown.scoreAvailable
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{t("recommendations.dataConfidence")}</dt>
          <dd>
            {t("recommendations.scoreFraction", {
              value: scoreBreakdown.dataConfidence,
              max: scoreBreakdown.maxDataConfidence,
            })}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{t("recommendations.pedigreeDiversity")}</dt>
          <dd>
            {formatDimensionScore(
              t,
              scoreBreakdown.pedigreeDiversity,
              scoreBreakdown.maxPedigreeDiversity,
              scoreBreakdown.scoreAvailable
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-white/10 pt-2 font-semibold text-white">
          <dt>{t("recommendations.total")}</dt>
          <dd>{scoreBreakdown.scoreAvailable ? `${scoreBreakdown.total} / 100` : t("insufficientData")}</dd>
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
