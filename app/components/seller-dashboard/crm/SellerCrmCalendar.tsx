"use client";

import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import SellerDashboardEmptyState from "@/app/components/seller-dashboard/SellerDashboardEmptyState";
import type { CrmVisit } from "@/app/components/seller-dashboard/crm/seller-crm-types";

type Props = {
  visits: CrmVisit[];
};

function SellerCrmCalendar({ visits }: Props) {
  const t = useTranslations("dashboard");
  const todayVisits = useMemo(() => visits.filter((visit) => visit.isToday), [visits]);
  const upcomingVisits = useMemo(() => visits.filter((visit) => !visit.isToday), [visits]);

  if (visits.length === 0) {
    return (
      <DashboardCard
        eyebrow={t("crm.calendar.eyebrow")}
        title={t("crm.calendar.title")}
        description={t("crm.calendar.descriptionEmpty")}
      >
        <SellerDashboardEmptyState
          title={t("crm.calendar.emptyTitle")}
          message={t("crm.calendar.emptyMessage")}
          icon="📅"
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      eyebrow={t("crm.calendar.eyebrow")}
      title={t("crm.calendar.title")}
      description={t("crm.calendar.description")}
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">
            {t("crm.calendar.todayHeading")}
          </h3>
          {todayVisits.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-gray-500">
              {t("crm.calendar.noVisitsToday")}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {todayVisits.map((visit) => (
                <VisitCard key={visit.id} visit={visit} highlight t={t} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-400">
            {t("crm.calendar.upcomingHeading")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingVisits.map((visit) => (
              <VisitCard key={visit.id} visit={visit} t={t} />
            ))}
          </div>
        </section>
      </div>
    </DashboardCard>
  );
}

function VisitCard({
  visit,
  highlight = false,
  t,
}: {
  visit: CrmVisit;
  highlight?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
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
            {t("crm.calendar.todayBadge")}
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
        {t("crm.calendar.viewDetails")}
      </button>
    </article>
  );
}

export default memo(SellerCrmCalendar);
