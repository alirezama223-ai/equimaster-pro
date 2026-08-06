import AdminMetricCard from "@/app/components/admin/AdminMetricCard";
import type { AdminEnterpriseStats } from "@/app/types/admin-panel";

type Props = {
  stats: AdminEnterpriseStats;
  labels: Record<string, string>;
};

export default function AdminEnterpriseMetrics({ stats, labels }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard label={labels.totalUsers} value={stats.totalUsers} href="/admin/users" accent="violet" />
      <AdminMetricCard label={labels.newUsers30d} value={stats.newUsers30d} href="/admin/users" accent="emerald" />
      <AdminMetricCard label={labels.totalListings} value={stats.totalListings} href="/admin/listings" />
      <AdminMetricCard label={labels.publishedListings} value={stats.publishedListings} href="/admin/listings?filter=active" accent="emerald" />
      <AdminMetricCard label={labels.pendingListings} value={stats.pendingListings} href="/admin/listings?filter=pending" accent="amber" />
      <AdminMetricCard label={labels.rejectedListings} value={stats.rejectedListings} href="/admin/listings?filter=rejected" accent="rose" />
      <AdminMetricCard label={labels.totalBreeders} value={stats.totalBreeders} href="/admin/breeders" />
      <AdminMetricCard label={labels.totalStallions} value={stats.totalStallions} href="/admin/stallions" />
      <AdminMetricCard label={labels.totalFavorites} value={stats.totalFavorites} />
      <AdminMetricCard label={labels.totalMessages} value={stats.totalMessages} href="/admin/messages" accent="violet" />
      <AdminMetricCard label={labels.totalNotifications} value={stats.totalNotifications} href="/admin/notifications" />
      <AdminMetricCard label={labels.openFeedback} value={stats.openFeedbackReports} href="/admin/feedback" accent="rose" />
    </div>
  );
}
