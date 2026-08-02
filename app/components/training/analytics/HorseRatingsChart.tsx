"use client";

import { useTranslations } from "next-intl";
import type { RatingTrendPoint } from "@/app/types/training-analytics";

type Props = {
  ratings: RatingTrendPoint[];
};

export default function HorseRatingsChart({ ratings }: Props) {
  const t = useTranslations("training");

  if (ratings.length === 0) {
    return <p className="text-sm text-gray-400">{t("analytics.ratingsEmpty")}</p>;
  }

  const maxRating = 10;

  return (
    <div className="space-y-4">
      <div className="flex h-48 items-end gap-2 border-b border-white/10 pb-2">
        {ratings.map((point) => {
          const heightPercent = (point.rating / maxRating) * 100;
          return (
            <div key={point.sessionId} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold text-blue-200">{point.rating}</span>
              <div className="flex h-36 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-blue-700 to-blue-400 transition-all duration-300"
                  style={{ height: `${heightPercent}%` }}
                  title={t("analytics.ratingTooltip", {
                    dateLabel: point.dateLabel,
                    rating: point.rating,
                  })}
                />
              </div>
              <span className="max-w-full truncate text-[10px] text-gray-500">{point.dateLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
