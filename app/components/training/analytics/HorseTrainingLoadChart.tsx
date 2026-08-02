"use client";

import { useTranslations } from "next-intl";
import type { TrainingLoadDay } from "@/app/types/training-analytics";

type Props = {
  load: TrainingLoadDay[];
};

export default function HorseTrainingLoadChart({ load }: Props) {
  const t = useTranslations("training");
  const maxDuration = Math.max(...load.map((day) => day.totalDurationMinutes), 1);
  const totalMinutes = load.reduce((sum, day) => sum + day.totalDurationMinutes, 0);
  const activeDays = load.filter((day) => day.sessionCount > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
        <span>{t("analytics.loadTotalMinutes", { minutes: totalMinutes })}</span>
        <span>{t("analytics.loadActiveDays", { days: activeDays })}</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[720px] grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
        {load.map((day) => {
          const intensity = day.totalDurationMinutes / maxDuration;
          const opacity = day.totalDurationMinutes > 0 ? Math.max(intensity, 0.15) : 0.05;
          return (
            <div
              key={day.date}
              title={t("analytics.loadTooltip", {
                dateLabel: day.dateLabel,
                sessionCount: day.sessionCount,
                minutes: day.totalDurationMinutes,
              })}
              className="aspect-square rounded-sm border border-white/5"
              style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
            />
          );
        })}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{t("analytics.loadRangeStart")}</span>
        <span>{t("analytics.loadRangeEnd")}</span>
      </div>
    </div>
  );
}
