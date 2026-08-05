"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import type { SellerChartSeries } from "@/app/components/seller-dashboard/seller-dashboard-utils";

type Props = {
  series: SellerChartSeries[];
};

function SellerDashboardChart({ chart }: { chart: SellerChartSeries }) {
  const t = useTranslations("dashboard");
  const maxValue = Math.max(...chart.points.map((point) => point.value), 1);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#08111F]/70 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{chart.label}</p>
          <p className="mt-1 text-xs text-gray-500">
            {chart.isTimeline ? t("analytics.last14Days") : t("analytics.topListings30Days")}
          </p>
        </div>
        <p className="text-2xl font-black text-white">{chart.total}</p>
      </div>

      {chart.isTimeline ? (
        <div className="flex h-36 items-end gap-1.5">
          {chart.points.map((point) => {
            const height = point.value > 0 ? Math.max((point.value / maxValue) * 100, 8) : 4;

            return (
              <div key={`${chart.key}-${point.label}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${height}%`,
                      background: `linear-gradient(180deg, ${chart.color}, ${chart.color}55)`,
                    }}
                    title={`${point.label}: ${point.value}`}
                  />
                </div>
                <span className="truncate text-[10px] text-gray-500">{point.label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-3">
          {chart.points.map((point) => {
            const widthPercent = point.value > 0 ? (point.value / maxValue) * 100 : 0;

            return (
              <li key={`${chart.key}-${point.label}`}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-gray-400">{point.label}</span>
                  <span className="font-semibold text-white">{point.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: chart.color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SellerDashboardAnalytics({ series }: Props) {
  const t = useTranslations("dashboard");

  return (
    <DashboardCard
      eyebrow={t("analytics.eyebrow")}
      title={t("analytics.title")}
      description={t("analytics.description")}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
        {series.map((chart) => (
          <SellerDashboardChart key={chart.key} chart={chart} />
        ))}
      </div>
    </DashboardCard>
  );
}

export default memo(SellerDashboardAnalytics);
