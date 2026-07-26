"use client";

import { BreedingAnalysisReport } from "@/app/types/breeding";
import { RecommendationScoreBreakdown } from "@/app/types/breeding-recommendations";
import { BreedingGoalAnalysisResult } from "@/app/types/traits";

type Props = {
  report: BreedingAnalysisReport;
  pedigreeScoreBreakdown: RecommendationScoreBreakdown | null;
  pedigreeRiskLabel: string;
  pedigreeCompatibilityScore: number | null;
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
  pedigreeRiskLabel,
  pedigreeCompatibilityScore,
  goalAnalysis,
}: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Combined Decision Support</p>
        <h3 className="mt-2 text-2xl font-bold text-white">Pedigree Safety & Breeding Goal Alignment</h3>
        <p className="mt-2 text-sm text-gray-400">
          These dimensions are evaluated separately. A strong result in one does not imply the other.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#08111F] p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500">Pedigree Safety</p>
          <p className="mt-2 text-2xl font-black text-white">{pedigreeRiskLabel}</p>
          <p className="mt-2 text-sm text-gray-300">
            Compatibility Score:{" "}
            {pedigreeCompatibilityScore !== null ? `${pedigreeCompatibilityScore}/100` : "Insufficient Data"}
          </p>
          <p className={`mt-2 text-sm ${panelConfidenceClass(report.dataConfidence.level)}`}>
            Analysis Confidence: {report.dataConfidence.label.toUpperCase()}
          </p>
          <ul className="mt-4 space-y-1 text-sm text-gray-400">
            <li>Common ancestors: {report.structureIndicators.commonAncestorCount}</li>
            <li>Linebreeding patterns: {report.structureIndicators.linebreedingPatternCount}</li>
            <li>
              Close relationship:{" "}
              {report.closeRelationshipWarnings.length > 0 ? "Detected" : "None detected in available data"}
            </li>
            <li>
              Mare completeness: {report.dataConfidence.mareCompleteness.completenessPercent}%
            </li>
            <li>
              Stallion completeness: {report.dataConfidence.stallionCompleteness.completenessPercent}%
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#08111F] p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500">Breeding Goal Alignment</p>
          {goalAnalysis ? (
            <>
              <p className="mt-2 text-2xl font-black text-white">
                {goalAnalysis.goalMatchScoreAvailable
                  ? `${goalAnalysis.goalMatchScore}/100`
                  : "Insufficient Data"}
              </p>
              <p className={`mt-2 text-sm ${panelConfidenceClass(goalAnalysis.goalMatchConfidence)}`}>
                Evidence Confidence: {goalAnalysis.goalMatchConfidence.replace("_", " ").toUpperCase()}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Goal coverage: {goalAnalysis.goalCoveragePercent}% of selected goals assessable on both horses
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                <ListBlock title="Strong complements" items={goalAnalysis.strongComplements} />
                <ListBlock title="Strengths preserved" items={goalAnalysis.strengthsPreserved} />
                <ListBlock title="Potential concerns" items={goalAnalysis.potentialConcerns} />
                <ListBlock title="Unknowns" items={goalAnalysis.unknowns} />
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-gray-400">
              Define breeding goals and ensure trait evidence exists to evaluate goal alignment.
            </p>
          )}
        </div>
      </div>

      {goalAnalysis ? (
        <p className="text-xs text-gray-500">{goalAnalysis.disclaimer}</p>
      ) : null}
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-semibold text-white">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 space-y-1 text-gray-300">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-gray-500">None</p>
      )}
    </div>
  );
}
