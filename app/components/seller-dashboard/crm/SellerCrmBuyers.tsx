"use client";

import { memo, useMemo, useState } from "react";
import DashboardCard from "@/app/components/shared/DashboardCard";
import SellerDashboardEmptyState from "@/app/components/seller-dashboard/SellerDashboardEmptyState";
import { getBuyerInitials } from "@/app/components/seller-dashboard/crm/seller-crm-demo-data";
import type { BuyerStatus, CrmBuyer } from "@/app/components/seller-dashboard/crm/seller-crm-types";

const STATUS_STYLES: Record<BuyerStatus, string> = {
  new: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  hot: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  returning: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  vip: "border-amber-500/30 bg-amber-500/10 text-amber-200",
};

const STATUS_LABELS: Record<BuyerStatus, string> = {
  new: "New",
  hot: "Hot",
  returning: "Returning",
  vip: "VIP",
};

type SortKey = "name" | "recent" | "status";
type FilterKey = "all" | BuyerStatus;

type Props = {
  buyers: CrmBuyer[];
};

function SellerCrmBuyers({ buyers }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const filteredBuyers = useMemo(() => {
    let result = [...buyers];

    if (query.trim()) {
      const normalized = query.trim().toLowerCase();
      result = result.filter(
        (buyer) =>
          buyer.name.toLowerCase().includes(normalized) ||
          buyer.interestedHorse.toLowerCase().includes(normalized) ||
          buyer.email.toLowerCase().includes(normalized)
      );
    }

    if (filter !== "all") {
      result = result.filter((buyer) => buyer.status === filter);
    }

    result.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "status") return a.status.localeCompare(b.status);
      return a.lastContactLabel.localeCompare(b.lastContactLabel);
    });

    return result;
  }, [buyers, filter, query, sort]);

  return (
    <DashboardCard
      eyebrow="Buyer CRM"
      title="Buyer relationships"
      description="Search, filter, and prioritize your most valuable prospects."
    >
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search buyers</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search buyers or horses"
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-blue-500/40"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as FilterKey)}
            className="min-h-11 rounded-xl border border-white/10 bg-[#08111F] px-3 text-sm text-white outline-none"
            aria-label="Filter buyers"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="hot">Hot</option>
            <option value="returning">Returning</option>
            <option value="vip">VIP</option>
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="min-h-11 rounded-xl border border-white/10 bg-[#08111F] px-3 text-sm text-white outline-none"
            aria-label="Sort buyers"
          >
            <option value="recent">Sort: Recent</option>
            <option value="name">Sort: Name</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      {filteredBuyers.length === 0 ? (
        <SellerDashboardEmptyState
          title="No buyers match"
          message="Try adjusting your search or filters to see more buyer relationships."
          icon="👥"
        />
      ) : (
        <ul className="space-y-3">
          {filteredBuyers.map((buyer) => (
            <li
              key={buyer.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#08111F]/70 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-sm font-bold text-white">
                  {getBuyerInitials(buyer.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{buyer.name}</p>
                  <p className="truncate text-sm text-blue-300">{buyer.interestedHorse}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <span className="text-xs text-gray-500">Last contact · {buyer.lastContactLabel}</span>
                <span
                  className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[buyer.status]}`}
                >
                  {STATUS_LABELS[buyer.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}

export default memo(SellerCrmBuyers);
