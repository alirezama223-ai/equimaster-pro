"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AdminReportSummary } from "@/app/types/admin-panel";

type Props = {
  report: AdminReportSummary;
};

export default function AdminReportsClient({ report }: Props) {
  const t = useTranslations("admin.reports");
  const locale = useLocale();

  function formatDate(value: string) {
    return new Date(value).toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-500">
        {t("generatedAt", { date: formatDate(report.generatedAt) })}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: t("totals.users"), value: report.totals.users },
          { label: t("totals.listings"), value: report.totals.listings },
          { label: t("totals.activeListings"), value: report.totals.activeListings },
          { label: t("totals.conversations"), value: report.totals.conversations },
          { label: t("totals.feedbackOpen"), value: report.totals.feedbackOpen },
          { label: t("totals.listingViews"), value: report.totals.listingViews },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-white/10 bg-[#111827] p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-black text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <h3 className="text-lg font-bold text-white">{t("listingsByStatus")}</h3>
          <dl className="mt-4 space-y-3">
            {Object.entries(report.listingsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between gap-4 text-sm">
                <dt className="capitalize text-gray-400">{status}</dt>
                <dd className="font-semibold text-white">{count}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <h3 className="text-lg font-bold text-white">{t("feedbackByStatus")}</h3>
          <dl className="mt-4 space-y-3">
            {Object.entries(report.feedbackByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between gap-4 text-sm">
                <dt className="capitalize text-gray-400">{status.replace("_", " ")}</dt>
                <dd className="font-semibold text-white">{count}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <h3 className="text-lg font-bold text-white">{t("recentListings")}</h3>
          <ul className="mt-4 space-y-4">
            {report.recentListings.map((listing) => (
              <li key={listing.id} className="flex items-start justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-white">{listing.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {listing.sellerName} · {listing.status}
                  </p>
                </div>
                <Link href={`/horses/${listing.slug}`} className="text-xs text-blue-400 hover:text-blue-300">
                  {t("viewListing")}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <h3 className="text-lg font-bold text-white">{t("topViewedListings")}</h3>
          <ul className="mt-4 space-y-4">
            {report.topViewedListings.map((listing) => (
              <li key={listing.id} className="flex items-start justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-white">{listing.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("viewCount", { count: listing.viewCount })}
                  </p>
                </div>
                <Link href={`/horses/${listing.slug}`} className="text-xs text-blue-400 hover:text-blue-300">
                  {t("viewListing")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
