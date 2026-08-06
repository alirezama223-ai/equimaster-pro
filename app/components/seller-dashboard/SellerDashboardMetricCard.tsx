"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type { SellerMetricCard } from "@/app/components/seller-dashboard/seller-dashboard-utils";

const accentStyles = {
  blue: "from-blue-500/15 via-blue-500/5 to-transparent border-blue-500/20",
  emerald: "from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/20",
  violet: "from-violet-500/15 via-violet-500/5 to-transparent border-violet-500/20",
  amber: "from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/20",
  rose: "from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/20",
} as const;

type Props = {
  metric: SellerMetricCard;
};

function SellerDashboardMetricCard({ metric }: Props) {
  const t = useTranslations("dashboard");
  const accent = metric.accent ?? "blue";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-sm transition duration-300 sm:p-5 ${accentStyles[accent]} [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-white/20 [@media(hover:hover)]:hover:shadow-[0_20px_40px_-24px_rgba(59,130,246,0.45)]`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_55%)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        {t(metric.labelKey)}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{metric.value}</p>
      {metric.trendKey ? (
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          {t(metric.trendKey, metric.trendValues)}
        </p>
      ) : null}
    </div>
  );
}

export default memo(SellerDashboardMetricCard);
