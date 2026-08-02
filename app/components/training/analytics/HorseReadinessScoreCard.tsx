"use client";

import { useTranslations } from "next-intl";
import type { RuleEvaluationResult } from "@/app/types/training-analytics";

type Props = {
  evaluation: RuleEvaluationResult;
};

function scoreClassName(score: number): string {
  if (score >= 85) return "text-emerald-300";
  if (score >= 70) return "text-blue-300";
  if (score >= 50) return "text-amber-200";
  return "text-red-300";
}

function ringClassName(score: number): string {
  if (score >= 85) return "stroke-emerald-400";
  if (score >= 70) return "stroke-blue-400";
  if (score >= 50) return "stroke-amber-400";
  return "stroke-red-400";
}

export default function HorseReadinessScoreCard({ evaluation }: Props) {
  const t = useTranslations("training");
  const displayScore = evaluation.combinedReadinessScore ?? evaluation.readinessScore;
  const trainingScore = evaluation.readinessScore;
  const healthScore = evaluation.healthScore;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (displayScore / 100) * circumference;

  function scoreLabel(score: number): string {
    if (score >= 85) return t("analytics.readinessReady");
    if (score >= 70) return t("analytics.readinessMostlyReady");
    if (score >= 50) return t("analytics.readinessCaution");
    return t("analytics.readinessNotReady");
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            {t("analytics.readinessEyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">{t("analytics.readinessTitle")}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
            {t("analytics.readinessDescription")}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <span>
              {t("analytics.trainingScore", { score: trainingScore })}
            </span>
            {healthScore != null ? (
              <span>
                {t("analytics.healthScore", { score: healthScore })}
              </span>
            ) : (
              <span>{t("analytics.noHealthRecords")}</span>
            )}
          </div>
          <p className={`mt-3 text-sm font-semibold uppercase tracking-[0.16em] ${scoreClassName(displayScore)}`}>
            {scoreLabel(displayScore)}
          </p>
        </div>

        <div className="relative mx-auto h-40 w-40 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-white/10"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={`${ringClassName(displayScore)} transition-all duration-500`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-black ${scoreClassName(displayScore)}`}>
              {displayScore}
            </span>
            <span className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("analytics.outOf100")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
