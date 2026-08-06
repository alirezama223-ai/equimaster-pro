import { getTranslations } from "next-intl/server";
import AdminBarChart from "@/app/components/admin/AdminBarChart";
import AdminEnterpriseMetrics from "@/app/components/admin/AdminEnterpriseMetrics";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import { getAdminDashboardCharts, getAdminEnterpriseStats } from "@/app/actions/admin-enterprise";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");
  const [{ stats, error }, { charts, error: chartsError }] = await Promise.all([
    getAdminEnterpriseStats(),
    getAdminDashboardCharts(),
  ]);

  if (!stats) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
        {error ?? t("dashboard.loadError")}
      </div>
    );
  }

  const metricLabels = {
    totalUsers: t("enterprise.totalUsers"),
    newUsers30d: t("enterprise.newUsers30d"),
    totalListings: t("enterprise.totalListings"),
    publishedListings: t("enterprise.publishedListings"),
    pendingListings: t("enterprise.pendingListings"),
    rejectedListings: t("enterprise.rejectedListings"),
    totalBreeders: t("stats.totalBreeders"),
    totalStallions: t("stats.totalStallions"),
    totalFavorites: t("enterprise.totalFavorites"),
    totalMessages: t("enterprise.totalMessages"),
    totalNotifications: t("enterprise.totalNotifications"),
    openFeedback: t("analytics.openFeedback"),
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("brandEyebrow")}
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
      />

      <AdminEnterpriseMetrics stats={stats} labels={metricLabels} />

      {charts && !chartsError ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminBarChart title={t("enterprise.charts.listingsPerMonth")} points={charts.listingsPerMonth} />
          <AdminBarChart title={t("enterprise.charts.newUsers")} points={charts.newUsersPerMonth} accent="emerald" />
          <AdminBarChart title={t("enterprise.charts.messages")} points={charts.messagesPerMonth} accent="violet" />
          <AdminBarChart title={t("enterprise.charts.views")} points={charts.viewsPerMonth} accent="amber" />
          <AdminBarChart
            title={t("enterprise.charts.countries")}
            points={charts.listingsByCountry}
            accent="violet"
          />
        </div>
      ) : null}
    </div>
  );
}
