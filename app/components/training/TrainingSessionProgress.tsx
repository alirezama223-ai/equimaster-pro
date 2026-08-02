"use client";

import { useTranslations } from "next-intl";

type Props = {
  completedCount: number;
  resolvedCount: number;
  totalCount: number;
};

export default function TrainingSessionProgress({
  completedCount,
  resolvedCount,
  totalCount,
}: Props) {
  const t = useTranslations("training");
  const progressPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">{t("sessionProgress.title")}</p>
        <p className="text-sm text-gray-400">
          {t("sessionProgress.exercisesDone", {
            resolved: resolvedCount,
            total: totalCount,
            completed: completedCount,
          })}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("sessionProgress.ariaLabel")}
        />
      </div>
    </div>
  );
}
