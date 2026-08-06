"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import SellerDashboardEmptyState from "@/app/components/seller-dashboard/SellerDashboardEmptyState";
import { formatAverageResponseDuration } from "@/app/components/seller-dashboard/crm/seller-crm-data";
import type { CrmPerformanceSnapshot } from "@/app/components/seller-dashboard/crm/seller-crm-types";

type Props = {
  performance: CrmPerformanceSnapshot;
};

function PerformanceCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: "blue" | "emerald" | "violet" | "amber" | "rose";
}) {
  const accents = {
    blue: "from-blue-500/15 via-blue-500/5 to-transparent border-blue-500/20",
    emerald: "from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/20",
    violet: "from-violet-500/15 via-violet-500/5 to-transparent border-violet-500/20",
    amber: "from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/20",
    rose: "from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/20",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-sm sm:p-5 ${accents[accent ?? "blue"]}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <p className="mt-3 text-lg font-bold leading-snug text-white sm:text-xl">{value}</p>
      {detail ? <p className="mt-2 text-xs text-gray-500">{detail}</p> : null}
    </div>
  );
}

function SellerCrmPerformance({ performance }: Props) {
  const t = useTranslations("dashboard");

  const hasAnyMetric =
    performance.bestPerformingHorse != null ||
    performance.mostViewedHorse != null ||
    performance.highestSavedHorse != null ||
    performance.averageResponseMs != null ||
    performance.conversionRate != null;

  if (!performance.hasListingData && !hasAnyMetric) {
    return (
      <DashboardCard
        eyebrow={t("crm.performance.eyebrow")}
        title={t("crm.performance.title")}
        description={t("crm.performance.description")}
      >
        <SellerDashboardEmptyState
          title={t("crm.performance.emptyTitle")}
          message={t("crm.performance.emptyMessage")}
          icon="📈"
        />
      </DashboardCard>
    );
  }

  const bestPerformingValue = performance.bestPerformingHorse
    ? performance.bestPerformingHorse
    : t("crm.performance.fallbacks.bestPerforming");
  const mostViewedValue = performance.mostViewedHorse
    ? performance.mostViewedHorse
    : t("crm.performance.fallbacks.noViews");
  const highestSavedValue = performance.highestSavedHorse
    ? performance.highestSavedHorse
    : t("crm.performance.fallbacks.noFavorites");
  const averageResponseValue =
    performance.averageResponseMs != null
      ? formatAverageResponseDuration(performance.averageResponseMs, t)
      : t(performance.averageResponseFallbackKey ?? "crm.performance.fallbacks.noInquiries");
  const conversionValue =
    performance.conversionRate != null
      ? t("crm.performance.fallbacks.conversionRate", { rate: performance.conversionRate })
      : t(performance.conversionFallbackKey ?? "crm.performance.fallbacks.noListingsForConversion");

  return (
    <DashboardCard
      eyebrow={t("crm.performance.eyebrow")}
      title={t("crm.performance.title")}
      description={t("crm.performance.description")}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <PerformanceCard
          label={t("crm.performance.bestPerformingHorse")}
          value={bestPerformingValue}
          accent="blue"
        />
        <PerformanceCard
          label={t("crm.performance.mostViewed")}
          value={mostViewedValue}
          detail={
            performance.mostViewedHorse
              ? t("crm.performance.viewsCount", { count: performance.mostViewedCount })
              : undefined
          }
          accent="violet"
        />
        <PerformanceCard
          label={t("crm.performance.highestSaved")}
          value={highestSavedValue}
          detail={
            performance.highestSavedHorse
              ? t("crm.performance.favoritesCount", { count: performance.highestSavedCount })
              : undefined
          }
          accent="rose"
        />
        <PerformanceCard
          label={t("crm.performance.averageResponse")}
          value={averageResponseValue}
          accent="emerald"
        />
        <PerformanceCard
          label={t("crm.performance.conversion")}
          value={conversionValue}
          accent="amber"
        />
      </div>
    </DashboardCard>
  );
}

export default memo(SellerCrmPerformance);
