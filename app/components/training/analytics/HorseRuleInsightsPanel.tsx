"use client";

import { useTranslations } from "next-intl";
import type { RuleEvaluationResult, RuleId, RuleInsight, RuleSeverity } from "@/app/types/training-analytics";

type Props = {
  evaluation: RuleEvaluationResult;
};

function severityClassName(severity: RuleSeverity): string {
  switch (severity) {
    case "alert":
      return "border-red-500/30 bg-red-500/5 text-red-200";
    case "watch":
      return "border-amber-500/30 bg-amber-500/5 text-amber-200";
    case "positive":
      return "border-emerald-500/30 bg-emerald-500/5 text-emerald-200";
    default:
      return "border-blue-500/30 bg-blue-500/5 text-blue-200";
  }
}

function RuleInsightCard({
  insight,
  ruleLabel,
  severityLabel,
  recommendationLabel,
}: {
  insight: RuleInsight;
  ruleLabel: string;
  severityLabel: string;
  recommendationLabel: string;
}) {
  return (
    <article className={`rounded-2xl border p-4 ${severityClassName(insight.severity)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">{ruleLabel}</p>
        <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {severityLabel}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{insight.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">{insight.explanation}</p>
      <div className="mt-4 rounded-xl border border-white/10 bg-[#08111F]/80 px-3 py-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{recommendationLabel}</p>
        <p className="mt-1 text-sm leading-relaxed text-white">{insight.recommendation}</p>
      </div>
    </article>
  );
}

export default function HorseRuleInsightsPanel({ evaluation }: Props) {
  const t = useTranslations("training");
  const { primaryInsight, insights } = evaluation;

  function ruleLabel(ruleId: RuleId): string {
    return t(`analytics.ruleLabels.${ruleId}` as Parameters<typeof t>[0]);
  }

  function severityLabel(severity: RuleSeverity): string {
    return t(`analytics.severity.${severity}` as Parameters<typeof t>[0]);
  }

  return (
    <div className="space-y-6">
      {primaryInsight ? (
        <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
            {t("analytics.primaryInsight")}
          </p>
          <h3 className="mt-3 text-2xl font-bold text-white">{primaryInsight.title}</h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300">
            {primaryInsight.explanation}
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#08111F]/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("analytics.recommendation")}</p>
            <p className="mt-2 text-sm leading-relaxed text-white">
              {primaryInsight.recommendation}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {insights.map((insight) => (
          <RuleInsightCard
            key={insight.ruleId}
            insight={insight}
            ruleLabel={ruleLabel(insight.ruleId)}
            severityLabel={severityLabel(insight.severity)}
            recommendationLabel={t("analytics.recommendation")}
          />
        ))}
      </div>
    </div>
  );
}
