import { getTranslations } from "next-intl/server";
import AdminMetricCard from "@/app/components/admin/AdminMetricCard";
import type { AdminEnterpriseStats } from "@/app/types/admin-panel";

type Props = {
  stats: AdminEnterpriseStats;
};

export default async function AdminAnalyticsGrid({ stats }: Props) {
  const t = await getTranslations("admin.enterprise");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard label={t("totalUsers")} value={stats.totalUsers} href="/admin/users" accent="violet" />
      <AdminMetricCard label={t("newUsers30d")} value={stats.newUsers30d} href="/admin/users" accent="emerald" />
      <AdminMetricCard label={t("totalListings")} value={stats.totalListings} href="/admin/listings" />
      <AdminMetricCard label={t("publishedListings")} value={stats.publishedListings} href="/admin/listings?filter=active" accent="emerald" />
      <AdminMetricCard label={t("pendingListings")} value={stats.pendingListings} href="/admin/listings?filter=pending" accent="amber" />
      <AdminMetricCard label={t("rejectedListings")} value={stats.rejectedListings} href="/admin/listings?filter=rejected" accent="rose" />
      <AdminMetricCard label={t("totalMessages")} value={stats.totalMessages} href="/admin/messages" accent="violet" />
      <AdminMetricCard label={t("totalNotifications")} value={stats.totalNotifications} href="/admin/notifications" />
    </div>
  );
}
