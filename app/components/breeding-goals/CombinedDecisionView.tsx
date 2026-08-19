"use client";

import { useTranslations } from "next-intl";
import { BreedingAnalysisReport } from "@/app/types/breeding";
import { BreedingGoalAnalysisResult } from "@/app/types/traits";
import {
  classifyRecommendationRisk,
  riskLevelLabel,
  scorePedigreeCompatibility,
} from "@/app/lib/breeding-recommendations/score";

type Props = {
  report: BreedingAnalysisReport;
  pedigreeScoreBreakdown?: ReturnType<typeof scorePedigreeCompatibility> | null;
  pedigreeRiskLabel?: string;
  pedigreeCompatibilityScore?: number | null;
  goalAnalysis: BreedingGoalAnalysisResult | null;
};

function panelConfidenceClass(level: string): string {
  switch (level) {
    case "HIGH":
    case "high":
      return "text-emerald-300";
    case "MODERATE":
    case "moderate":
      return "text-amber-200";
    default:
      return "text-orange-300";
  }
}

export default function CombinedDecisionView({
  report,
  pedigreeScoreBreakdown,
  pedigreeRiskLabel,
  pedigreeCompatibilityScore,
  goalAnalysis,
}: Props) {
  const t = useTranslations("breeding");
  const derivedBreakdown = pedigreeScoreBreakdown ?? scorePedigreeCompatibility(report);
  const derivedRiskLabel = pedigreeRiskLabel ?? riskLevelLabel(classifyRecommendationRisk(report));
  const derivedCompatibilityScore =
    pedigreeCompatibilityScore ?? (derivedBreakdown.scoreAvailable ? derivedBreakdown.total : null);

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{t("combined.eyebrow")}</p>
        <h3 className="mt-2 text-2xl font-bold text-white">{t("combined.title")}</h3>
        <p className="mt-2 text-sm text-gray-400">{t("combined.subtitle")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#08111F] p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500">{t("combined.pedigreeSafety")}</p>
          <p className="mt-2 text-2xl font-black text-white">{derivedRiskLabel}</p>
          <p className="mt-2 text-sm text-gray-300">
            {t("combined.compatibilityScore")} {" "}
            {derivedCompatibilityScore !== null ? `${derivedCompatibilityScore}/100` : t("insufficientData")}
          </p>
          <p className={`mt-2 text-sm ${panelConfidenceClass(report.dataConfidence.level)}`}>
            {t("combined.analysisConfidence", { level: report.dataConfidence.label.toUpperCase() })}
          </p>
          <ul className="mt-4 space-y-1 text-sm text-gray-400">
            <li>{t("combined.commonAncestors", { count: report.structureIndicators.commonAncestorCount })}</li>
            <li>{t("combined.linebreedingPatterns", { count: report.structureIndicators.linebreedingPatternCount })}</li>
            <li>
              {t("combined.closeRelationship")} {" "}
              {report.closeRelationshipWarnings.length > 0
                ? t("combined.closeRelationshipDetected")
                : t("combined.closeRelationshipNone")}
            </li>
            <li>{t("combined.mareCompleteness", { percent: report.dataConfidence.mareCompleteness.completenessPercent })}</li>
            <li>{t("combined.stallionCompleteness", { percent: report.dataConfidence.stallionCompleteness.completenessPercent })}</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#08111F] p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500">{t("combined.goalAlignment")}</p>
          {goalAnalysis ? (
            <>
              <p className="mt-2 text-2xl font-black text-white">
                {goalAnalysis.goalMatchScoreAvailable ? `${goalAnalysis.goalMatchScore}/100` : t("insufficientData")}
              </p>
              <p className={`mt-2 text-sm ${panelConfidenceClass(goalAnalysis.goalMatchConfidence)}`}>
                {t("combined.evidenceConfidence", { level: goalAnalysis.goalMatchConfidence.replace("_", " ").toUpperCase() })}
              </p>
              <p className="mt-2 text-sm text-gray-400">{t("combined.goalCoverage", { percent: goalAnalysis.goalCoveragePercent })}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                <ListBlock title={t("combined.strongComplements")} items={goalAnalysis.strongComplements} none={t("combined.none")} />
                <ListBlock title={t("combined.strengthsPreserved")} items={goalAnalysis.strengthsPreserved} none={t("combined.none")} />
                <ListBlock title={t("combined.potentialConcerns")} items={goalAnalysis.potentialConcerns} none={t("combined.none")} />
                <ListBlock title={t("combined.unknowns")} items={goalAnalysis.unknowns} none={t("combined.none")} />
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-gray-400">{t("combined.defineGoalsPrompt")}</p>
          )}
        </div>
      </div>

      {goalAnalysis ? <p className="text-xs text-gray-500">{goalAnalysis.disclaimer}</p> : null}
    </section>
  );
}

function ListBlock({ title, items, none }: { title: string; items: string[]; none: string }) {
  return (
    <div>
      <p className="font-semibold text-white">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 space-y-1 text-gray-300">{items.map((item) => <li key={item}>{item}</li>)}</ul>
      ) : (
        <p className="mt-1 text-gray-500">{none}</p>
      )}
    </div>
  );
}
