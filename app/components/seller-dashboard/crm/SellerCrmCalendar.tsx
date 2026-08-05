"use client";

import { memo, useMemo } from "react";
import DashboardCard from "@/app/components/shared/DashboardCard";
import SellerDashboardEmptyState from "@/app/components/seller-dashboard/SellerDashboardEmptyState";
import type { CrmVisit } from "@/app/components/seller-dashboard/crm/seller-crm-types";

type Props = {
  visits: CrmVisit[];
};

function SellerCrmCalendar({ visits }: Props) {
  const todayVisits = useMemo(() => visits.filter((visit) => visit.isToday), [visits]);
  const upcomingVisits = useMemo(() => visits.filter((visit) => !visit.isToday), [visits]);

  if (visits.length === 0) {
    return (
      <DashboardCard eyebrow="Calendar" title="Visits & appointments" description="Plan buyer viewings and stable visits.">
        <SellerDashboardEmptyState
          title="No visits scheduled"
          message="Upcoming buyer appointments will appear here once scheduled."
          icon="📅"
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      eyebrow="Calendar"
      title="Visits & appointments"
      description="Today's viewings and upcoming buyer appointments."
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">
            Today&apos;s visits
          </h3>
          {todayVisits.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-gray-500">
              No visits scheduled for today.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {todayVisits.map((visit) => (
                <VisitCard key={visit.id} visit={visit} highlight />
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-400">
            Upcoming appointments
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingVisits.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </section>
      </div>
    </DashboardCard>
  );
}

function VisitCard({ visit, highlight = false }: { visit: CrmVisit; highlight?: boolean }) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-blue-500/25 bg-gradient-to-br from-blue-600/15 to-transparent"
          : "border-white/[0.06] bg-[#08111F]/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{visit.dateLabel}</p>
          <p className="text-xs text-gray-500">{visit.timeLabel}</p>
        </div>
        {highlight ? (
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200">
            Today
          </span>
        ) : null}
      </div>
      <div className="mt-4 space-y-1">
        <p className="font-medium text-white">{visit.horseName}</p>
        <p className="text-sm text-gray-400">{visit.buyerName}</p>
        <p className="text-xs text-gray-500">{visit.location}</p>
      </div>
      <button
        type="button"
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        View details
      </button>
    </article>
  );
}

export default memo(SellerCrmCalendar);
