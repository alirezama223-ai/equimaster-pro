"use client";

import { useTranslations } from "next-intl";
import { GoalTraitAnalysis } from "@/app/types/traits";

type Props = {
  analyses: GoalTraitAnalysis[];
};

function confidenceLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export default function GoalTraitExplainList({ analyses }: Props) {
  const t = useTranslations("breeding");

  return (
    <div className="space-y-3">
      {analyses.map((item) => (
        <div key={`${item.goalType}-${item.traitKey}`} className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-white">
              {item.label} · {item.goalType === "improve" ? t("goalAnalysis.improveGoal") : t("goalAnalysis.preserveGoal")}
              {item.goalType === "improve" ? ` · ${t("goalAnalysis.priorityGoal", { priority: item.priority })}` : ""}
            </p>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-200">
              {item.statusLabel}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-300">{item.explanation}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-gray-500">
            <p>
              {t("goalAnalysis.mareEvidence")}{" "}
              {item.mareScore !== null
                ? t("goalAnalysis.evidenceScore", {
                    score: item.mareScore,
                    confidence: confidenceLabel(item.mareConfidence),
                  })
                : t("insufficientData")}
            </p>
            <p>
              {t("goalAnalysis.stallionEvidence")}{" "}
              {item.stallionScore !== null
                ? t("goalAnalysis.evidenceScore", {
                    score: item.stallionScore,
                    confidence: confidenceLabel(item.stallionConfidence),
                  })
                : t("insufficientData")}
            </p>
          </div>
          {item.weightedContribution !== undefined ? (
            <div className="mt-3 rounded-xl border border-blue-400/10 bg-blue-400/5 px-3 py-2 text-xs text-gray-400">
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <span>Priority ×{item.priorityWeight}</span>
                <span>Status {item.statusPoints}/100</span>
                <span>Confidence ×{item.avgConfidenceMultiplier}</span>
                <span className="font-semibold text-gray-200">
                  Contribution {item.weightedContribution}/{item.maxContribution}
                </span>
              </div>
            </div>
          ) : null}
          {item.status === "insufficient_data" ? (
            <p className="mt-2 text-xs text-amber-200/90">
              {t("goalAnalysis.notScoredUntilEvidence")}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
