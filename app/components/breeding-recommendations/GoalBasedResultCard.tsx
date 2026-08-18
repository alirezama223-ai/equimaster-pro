"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import GoalTraitExplainList from "@/app/components/breeding-goals/GoalTraitExplainList";
import { GoalBasedRecommendationResult } from "@/app/lib/breeding-goals/recommendations";

type Props = { result: GoalBasedRecommendationResult; marePedigreeId: string };

export default function GoalBasedResultCard({ result, marePedigreeId }: Props) {
  const t = useTranslations("breeding");
  const [showEvidence, setShowEvidence] = useState(false);
  const breedingLabUrl = `/breeding-lab?mare=${marePedigreeId}&stallion=${result.pedigreeHorseId}`;
  const isHighPedigreeRisk = result.pedigreeRiskLabel === "HIGH CONCERN";
  const finalScore = result.finalMatchScore;

  return (
    <article className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm text-gray-500">#{result.rank}</p><h3 className="text-2xl font-bold text-white">{result.name}</h3><p className="mt-1 text-sm text-gray-400">{result.studFeeLabel}</p></div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500">{t("recommendations.compatibilityScore")}</p>
          {finalScore !== null ? <><p className="text-4xl font-black text-blue-400">{finalScore}/100</p><p className="text-xs text-gray-500">{t("recommendations.basedOnPedigree")}</p></> : <p className="text-2xl font-black text-gray-300">{t("insufficientData")}</p>}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3"><p className="text-xs uppercase tracking-wide text-gray-500">{t("recommendations.goalMatch")}</p><p className="mt-1 text-xl font-bold text-emerald-400">{result.goalMatchScore !== null ? `${result.goalMatchScore}/100` : t("insufficientData")}</p><p className="text-xs text-gray-500">{result.finalMatchBreakdown.goalWeight}% weight</p></div>
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3"><p className="text-xs uppercase tracking-wide text-gray-500">{t("recommendations.pedigreeScore")}</p><p className="mt-1 text-xl font-bold text-blue-300">{result.compatibilityScore !== null ? `${result.compatibilityScore}/100` : t("insufficientData")}</p><p className="text-xs text-gray-500">{result.finalMatchBreakdown.pedigreeWeight}% weight</p></div>
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3"><p className="text-xs uppercase tracking-wide text-gray-500">{t("recommendations.pedigreeLabel", { label: "" })}</p><p className={`mt-1 text-sm font-bold ${isHighPedigreeRisk ? "text-red-300" : "text-emerald-300"}`}>{result.pedigreeRiskLabel}</p></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300">{t("recommendations.analysisConfidence", { level: result.goalMatchConfidence.replace(/_/g, " ") })}</span></div>
      {result.pedigreeWarnings.length > 0 ? <ul className="mt-4 space-y-1 text-sm text-amber-200">{result.pedigreeWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
        <div><p className="font-semibold text-white">{t("recommendations.strongComplements")}</p><p className="mt-1 text-gray-300">{result.goalAnalysis?.strongComplements.join(", ") || t("combined.none")}</p></div>
        <div><p className="font-semibold text-white">{t("recommendations.potentialConcerns")}</p><p className="mt-1 text-gray-300">{result.goalAnalysis?.potentialConcerns.join(", ") || t("combined.none")}</p></div>
        <div className="sm:col-span-2"><p className="font-semibold text-white">{t("recommendations.limitedUnknownEvidence")}</p><p className="mt-1 text-gray-300">{result.goalAnalysis?.unknowns.join(", ") || t("recommendations.noUnknownGoals")}</p></div>
      </div>

      {result.goalAnalysis?.traitAnalyses.length ? <div className="mt-4"><button type="button" onClick={() => setShowEvidence((value) => !value)} className="text-sm font-semibold text-blue-400 hover:text-blue-300">{showEvidence ? t("recommendations.hideGoalEvidence") : t("recommendations.showGoalEvidence")}</button>{showEvidence ? <div className="mt-3"><GoalTraitExplainList analyses={result.goalAnalysis.traitAnalyses} /></div> : null}</div> : null}
      <div className="mt-5 flex flex-wrap gap-3"><Link href={breedingLabUrl} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{t("recommendations.analyzeFullCross")}</Link><Link href={`/stallions/${result.stallionDirectoryId}`} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300">{t("recommendations.viewStallion")}</Link></div>
    </article>
  );
}
