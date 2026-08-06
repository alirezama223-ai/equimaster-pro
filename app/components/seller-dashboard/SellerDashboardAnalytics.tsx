"use client";

import { memo } from "react";
import { useLocale, useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import type { SellerChartSeries } from "@/app/components/seller-dashboard/seller-dashboard-utils";
import { formatAnalyticsTimelineLabel } from "@/app/components/seller-dashboard/seller-dashboard-utils";

type Props = {
  series: SellerChartSeries[];
};

function SellerDashboardChart({ chart }: { chart: SellerChartSeries }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const hasEmptyChart =
    chart.points.length === 1 && chart.points[0]?.isEmptyPlaceholder === true;
  const maxValue = hasEmptyChart
    ? 1
    : Math.max(...chart.points.map((point) => point.value), 1);

  const getPointLabel = (point: SellerChartSeries["points"][number]) => {
    if (point.isEmptyPlaceholder && chart.emptyKey) {
      return t(chart.emptyKey);
    }
    if (point.dateKey) {
      return formatAnalyticsTimelineLabel(point.dateKey, locale);
    }
    return point.label ?? "";
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#08111F]/70 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{t(chart.labelKey)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {chart.isTimeline ? t("analytics.last14Days") : t("analytics.topListings30Days")}
          </p>
        </div>
        <p className="text-2xl font-black text-white">{chart.total}</p>
      </div>

      {hasEmptyChart ? (
        <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-white/10 px-4">
          <p className="text-sm text-gray-500">{t(chart.emptyKey ?? "analytics.empty.noViews")}</p>
        </div>
      ) : chart.isTimeline ? (
        <div className="flex h-36 items-end gap-1.5">
          {chart.points.map((point) => {
            const height = point.value > 0 ? Math.max((point.value / maxValue) * 100, 8) : 4;
            const pointLabel = getPointLabel(point);

            return (
              <div key={`${chart.key}-${pointLabel}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${height}%`,
                      background: `linear-gradient(180deg, ${chart.color}, ${chart.color}55)`,
                    }}
                    title={`${pointLabel}: ${point.value}`}
                  />
                </div>
                <span className="truncate text-[10px] text-gray-500">{pointLabel}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-3">
          {chart.points.map((point) => {
            const widthPercent = point.value > 0 ? (point.value / maxValue) * 100 : 0;
            const pointLabel = getPointLabel(point);

            return (
              <li key={`${chart.key}-${pointLabel}`}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-gray-400">{pointLabel}</span>
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
