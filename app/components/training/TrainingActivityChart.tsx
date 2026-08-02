"use client";

import { useTranslations } from "next-intl";
import type { TrainingActivityDay } from "@/app/types/training";

type Props = {
  activity: TrainingActivityDay[];
};

export default function TrainingActivityChart({ activity }: Props) {
  const t = useTranslations("training");
  const maxCount = Math.max(...activity.map((day) => day.sessionCount), 1);

  return (
    <ul className="space-y-3">
      {activity.map((day) => {
        const widthPercent = day.sessionCount > 0 ? (day.sessionCount / maxCount) * 100 : 0;

        return (
          <li key={day.date} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-300">{day.dateLabel}</span>
              <span className="font-medium text-white">
                {t("activity.sessionCount", { count: day.sessionCount })}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
