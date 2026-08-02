"use client";

import { useTranslations } from "next-intl";
import { BreedingGoalAnalysisResult } from "@/app/types/traits";
import GoalTraitExplainList from "@/app/components/breeding-goals/GoalTraitExplainList";

type Props = {
  analysis: BreedingGoalAnalysisResult;
};

export default function BreedingGoalAnalysisView({ analysis }: Props) {
  const t = useTranslations("breeding");

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{t("goalAnalysis.eyebrow")}</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{t("goalAnalysis.title")}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500">{t("goalAnalysis.goalMatch")}</p>
          <p className="text-3xl font-black text-emerald-400">
            {analysis.goalMatchScoreAvailable ? `${analysis.goalMatchScore}/100` : t("insufficientData")}
          </p>
          <p className="text-xs text-gray-500">
            {t("goalAnalysis.confidence", {
              level: analysis.goalMatchConfidence.replace("_", " ").toUpperCase(),
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary title={t("goalAnalysis.mareStrengths")} items={analysis.mareSummary.strengths} empty={t("goalAnalysis.noneWithEvidence")} />
        <Summary title={t("goalAnalysis.improvementAreas")} items={analysis.mareSummary.improvementAreas} empty={t("goalAnalysis.noneWithEvidence")} />
        <Summary title={t("goalAnalysis.insufficientEvidence")} items={analysis.mareSummary.unknowns} empty={t("goalAnalysis.noneWithEvidence")} />
      </div>

      {analysis.reinforcedWeaknesses.length > 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
          <p className="font-semibold">{t("goalAnalysis.reinforcedWeakness")}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {analysis.reinforcedWeaknesses.map((item) => (
              <li key={item}>⚠ {item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">{t("goalAnalysis.goalReasoning")}</p>
        <GoalTraitExplainList analyses={analysis.traitAnalyses} />
      </div>

      <p className="text-xs text-gray-500">{analysis.disclaimer}</p>
    </section>
  );
}

function Summary({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
      <p className="font-semibold text-white">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-gray-300">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-500">{empty}</p>
      )}
    </div>
  );
}
