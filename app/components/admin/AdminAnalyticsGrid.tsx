import { getTranslations } from "next-intl/server";
import AdminMetricCard from "@/app/components/admin/AdminMetricCard";
import type { AdminAnalyticsStats } from "@/app/types/admin-panel";

type Props = {
  stats: AdminAnalyticsStats;
};

export default async function AdminAnalyticsGrid({ stats }: Props) {
  const t = await getTranslations("admin.analytics");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard label={t("totalUsers")} value={stats.totalUsers} href="/admin/users" accent="violet" />
      <AdminMetricCard label={t("totalListings")} value={stats.totalListings} href="/admin/listings" />
      <AdminMetricCard label={t("activeListings")} value={stats.activeListings} href="/admin/listings?filter=active" accent="emerald" />
      <AdminMetricCard label={t("draftListings")} value={stats.draftListings} href="/admin/listings?filter=draft" accent="amber" />
      <AdminMetricCard label={t("verifiedSellers")} value={stats.verifiedSellers} href="/admin/sellers" accent="emerald" />
      <AdminMetricCard label={t("openFeedback")} value={stats.openFeedbackReports} href="/admin/feedback" accent="rose" />
      <AdminMetricCard label={t("conversations")} value={stats.totalConversations} />
      <AdminMetricCard label={t("listingViews")} value={stats.totalListingViews} accent="violet" />
      <AdminMetricCard label={t("published30Days")} value={stats.listingsPublishedLast30Days} />
      <AdminMetricCard label={t("pendingBreeders")} value={stats.pendingBreeders} href="/admin/breeders?filter=pending" accent="amber" />
      <AdminMetricCard label={t("pendingStallions")} value={stats.pendingStallions} href="/admin/stallions?filter=pending" accent="amber" />
      <AdminMetricCard label={t("pedigreeRecords")} value={stats.totalPedigreeHorses} href="/admin/pedigree" />
    </div>
  );
}
