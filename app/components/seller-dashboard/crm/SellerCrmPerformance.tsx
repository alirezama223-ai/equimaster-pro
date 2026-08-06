"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
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

  const bestPerformingValue = performance.bestPerformingFallbackKey
    ? t(performance.bestPerformingFallbackKey)
    : performance.bestPerformingHorse;
  const mostViewedValue = performance.mostViewedFallbackKey
    ? t(performance.mostViewedFallbackKey)
    : performance.mostViewedHorse;
  const highestSavedValue = performance.highestSavedFallbackKey
    ? t(performance.highestSavedFallbackKey)
    : performance.highestSavedHorse;

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
          detail={t("crm.performance.viewsCount", { count: performance.mostViewedCount })}
          accent="violet"
        />
        <PerformanceCard
          label={t("crm.performance.highestSaved")}
          value={highestSavedValue}
          detail={t("crm.performance.favoritesCount", { count: performance.highestSavedCount })}
          accent="rose"
        />
        <PerformanceCard
          label={t("crm.performance.averageResponse")}
          value={t(performance.averageResponseKey)}
          accent="emerald"
        />
        <PerformanceCard
          label={t("crm.performance.conversion")}
          value={t(performance.conversionKey, performance.conversionValues)}
          accent="amber"
        />
      </div>
    </DashboardCard>
  );
}

export default memo(SellerCrmPerformance);
