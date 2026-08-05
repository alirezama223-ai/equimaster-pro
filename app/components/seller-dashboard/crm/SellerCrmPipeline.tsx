"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import SellerDashboardEmptyState from "@/app/components/seller-dashboard/SellerDashboardEmptyState";
import { getBuyerInitials } from "@/app/components/seller-dashboard/seller-dashboard-utils";
import {
  PIPELINE_COLUMNS,
  type PipelineDeal,
  type PipelinePriority,
  type PipelineStage,
} from "@/app/components/seller-dashboard/crm/seller-crm-types";

const PRIORITY_STYLES: Record<PipelinePriority, string> = {
  high: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  low: "border-white/10 bg-white/5 text-gray-300",
};

type Props = {
  initialDeals: PipelineDeal[];
};

function SellerCrmPipeline({ initialDeals }: Props) {
  const t = useTranslations("dashboard");
  const [deals, setDeals] = useState(initialDeals);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const dealsByStage = useMemo(() => {
    const grouped = Object.fromEntries(
      PIPELINE_COLUMNS.map((column) => [column.key, [] as PipelineDeal[]])
    ) as Record<PipelineStage, PipelineDeal[]>;

    for (const deal of deals) {
      grouped[deal.stage]?.push(deal);
    }

    return grouped;
  }, [deals]);

  const handleDrop = useCallback((stage: PipelineStage) => {
    if (!draggedId) return;

    setDeals((current) =>
      current.map((deal) => (deal.id === draggedId ? { ...deal, stage } : deal))
    );
    setDraggedId(null);
  }, [draggedId]);

  return (
    <DashboardCard
      eyebrow={t("crm.pipeline.eyebrow")}
      title={t("crm.pipeline.title")}
      description={t("crm.pipeline.description")}
    >
      {deals.length === 0 ? (
        <SellerDashboardEmptyState
          title={t("crm.pipeline.emptyTitle")}
          message={t("crm.pipeline.emptyMessage")}
          icon="📋"
        />
      ) : (
        <div className="relative min-w-0">
          <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {PIPELINE_COLUMNS.map((column) => (
              <div
                key={column.key}
                className="w-[min(82vw,280px)] shrink-0 lg:w-auto"
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(column.key)}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{t(column.labelKey)}</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-400">
                    {dealsByStage[column.key].length}
                  </span>
                </div>

                <div className="min-h-[220px] space-y-3 rounded-2xl border border-white/[0.06] bg-[#08111F]/50 p-3">
                  {dealsByStage[column.key].map((deal) => (
                    <article
                      key={deal.id}
                      draggable
                      onDragStart={() => setDraggedId(deal.id)}
                      onDragEnd={() => setDraggedId(null)}
                      className={`cursor-grab rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#132038]/90 to-[#0a1220] p-3 shadow-lg transition active:cursor-grabbing ${
                        draggedId === deal.id ? "opacity-60 ring-2 ring-blue-500/40" : "hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-blue-500/10 text-xs font-bold text-white">
                          {getBuyerInitials(deal.buyerName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-white">{deal.buyerName}</p>
                          <p className="truncate text-xs text-blue-300">{deal.horseName}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">{deal.priceLabel}</span>
                        <span className="text-[11px] text-gray-500">{deal.dateLabel}</span>
                      </div>
                      <div className="mt-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[deal.priority]}`}
                        >
                          {t(`crm.pipeline.priority.${deal.priority}`)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}

export default memo(SellerCrmPipeline);
