"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import AdminBarChart from "@/app/components/admin/AdminBarChart";
import AdminMetricCard from "@/app/components/admin/AdminMetricCard";
import type { AdminAnalyticsDetail } from "@/app/types/admin-panel";

type Props = {
  analytics: AdminAnalyticsDetail;
};

export default function AdminAnalyticsClient({ analytics }: Props) {
  const t = useTranslations("admin.analyticsPage");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label={t("views")} value={analytics.viewsCount} accent="blue" />
        <AdminMetricCard label={t("favorites")} value={analytics.favoritesCount} accent="violet" />
        <AdminMetricCard label={t("inquiries")} value={analytics.inquiriesCount} accent="emerald" />
        <AdminMetricCard label={t("conversionRate")} value={`${analytics.conversionRate}%`} accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminBarChart title={t("countries")} points={analytics.countries} accent="violet" />
        <AdminBarChart title={t("topBreeds")} points={analytics.topBreeds} accent="emerald" />
        <AdminBarChart title={t("topDisciplines")} points={analytics.topDisciplines} accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <h3 className="text-lg font-bold text-white">{t("mostViewedHorses")}</h3>
          <ul className="mt-4 space-y-4">
            {analytics.topViewedHorses.map((listing) => (
              <li key={listing.id} className="flex items-start justify-between gap-4 border-b border-white/5 pb-4 last:border-0">
                <div>
                  <p className="font-semibold text-white">{listing.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{t("viewCount", { count: listing.viewCount })}</p>
                </div>
                <Link href={`/horses/${listing.slug}`} className="text-xs text-blue-400 hover:text-blue-300">
                  {t("viewListing")}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <h3 className="text-lg font-bold text-white">{t("topSellers")}</h3>
          <ul className="mt-4 space-y-4">
            {analytics.topSellers.map((seller) => (
              <li key={seller.userId} className="flex items-start justify-between gap-4 border-b border-white/5 pb-4 last:border-0">
                <div>
                  <p className="font-mono text-sm text-white">{seller.sellerReference}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("sellerStats", {
                      listings: seller.listingCount,
                      views: seller.totalViews,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
