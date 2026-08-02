"use client";

import { useTranslations } from "next-intl";
import type { HorseFeelingDistribution } from "@/app/types/training-analytics";

type Props = {
  distribution: HorseFeelingDistribution[];
};

const FEELING_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-pink-500",
];

export default function HorseFeelingDistributionChart({ distribution }: Props) {
  const t = useTranslations("training");

  if (distribution.length === 0) {
    return <p className="text-sm text-gray-400">{t("analytics.feelingsEmpty")}</p>;
  }

  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...distribution.map((item) => item.count), 1);

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
        {distribution.map((item, index) => (
          <div
            key={item.feeling}
            className={`${FEELING_COLORS[index % FEELING_COLORS.length]} h-full`}
            style={{ width: `${(item.count / total) * 100}%` }}
            title={`${item.feeling}: ${item.count}`}
          />
        ))}
      </div>
      <ul className="space-y-2">
        {distribution.map((item, index) => {
          const widthPercent = (item.count / maxCount) * 100;
          return (
            <li key={item.feeling} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-300">{item.feeling}</span>
                <span className="text-gray-500">
                  {item.count} ({Math.round((item.count / total) * 100)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${FEELING_COLORS[index % FEELING_COLORS.length]} transition-all duration-300`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
