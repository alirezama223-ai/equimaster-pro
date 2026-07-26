"use client";

import { BreedingGoalAnalysisResult } from "@/app/types/traits";
import GoalTraitExplainList from "@/app/components/breeding-goals/GoalTraitExplainList";

type Props = {
  analysis: BreedingGoalAnalysisResult;
};

export default function BreedingGoalAnalysisView({ analysis }: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Breeding Outcome Intelligence</p>
          <h3 className="mt-2 text-2xl font-bold text-white">Trait & Breeding Goal Analysis</h3>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500">Breeding Goal Match</p>
          <p className="text-3xl font-black text-emerald-400">
            {analysis.goalMatchScoreAvailable ? `${analysis.goalMatchScore}/100` : "Insufficient Data"}
          </p>
          <p className="text-xs text-gray-500">
            Confidence: {analysis.goalMatchConfidence.replace("_", " ").toUpperCase()}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary title="Mare strengths" items={analysis.mareSummary.strengths} />
        <Summary title="Potential improvement areas" items={analysis.mareSummary.improvementAreas} />
        <Summary title="Insufficient evidence" items={analysis.mareSummary.unknowns} />
      </div>

      {analysis.reinforcedWeaknesses.length > 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
          <p className="font-semibold">Potential Reinforced Weakness</p>
          <ul className="mt-2 space-y-1 text-sm">
            {analysis.reinforcedWeaknesses.map((item) => (
              <li key={item}>⚠ {item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">Goal-by-goal evidence reasoning</p>
        <GoalTraitExplainList analyses={analysis.traitAnalyses} />
      </div>

      <p className="text-xs text-gray-500">{analysis.disclaimer}</p>
    </section>
  );
}

function Summary({ title, items }: { title: string; items: string[] }) {
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
        <p className="mt-2 text-sm text-gray-500">None with sufficient evidence.</p>
      )}
    </div>
  );
}
