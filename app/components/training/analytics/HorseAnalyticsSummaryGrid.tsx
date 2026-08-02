"use client";

import { useTranslations } from "next-intl";
import { formatDurationMinutes } from "@/app/lib/training/format";
import type { HorseTrainingSummary } from "@/app/types/training-analytics";

type Props = {
  summary: HorseTrainingSummary;
};

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function HorseAnalyticsSummaryGrid({ summary }: Props) {
  const t = useTranslations("training");

  function formatRating(value: number | null): string {
    if (value == null) return t("summary.notAvailable");
    return `${value.toFixed(1)}/10`;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <SummaryStat label={t("analytics.totalSessions")} value={String(summary.totalSessions)} />
      <SummaryStat label={t("analytics.completionRate")} value={summary.completionRateLabel} />
      <SummaryStat label={t("analytics.averageRating")} value={formatRating(summary.averageRating)} />
      <SummaryStat
        label={t("analytics.averageDuration")}
        value={formatDurationMinutes(summary.averageDurationMinutes)}
      />
      <SummaryStat
        label={t("analytics.currentStreak")}
        value={t("analytics.streakDays", { count: summary.currentTrainingStreak })}
      />
      <SummaryStat
        label={t("analytics.lastSession")}
        value={summary.lastSessionDateLabel ?? t("summary.notAvailable")}
      />
    </div>
  );
}
