"use client";

import { useTranslations } from "next-intl";
import type { TrainingSummary } from "@/app/types/training";

type Props = {
  summary: TrainingSummary;
};

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

export default function TrainingSummaryCard({ summary }: Props) {
  const t = useTranslations("training");

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryStat label={t("summary.totalSessions")} value={String(summary.totalSessions)} />
      <SummaryStat label={t("summary.completedSessions")} value={String(summary.completedSessions)} />
      <SummaryStat label={t("summary.completionRate")} value={summary.completionRateLabel} />
      <SummaryStat
        label={t("summary.lastSessionDate")}
        value={summary.lastSessionDateLabel ?? t("summary.notAvailable")}
      />
    </div>
  );
}
