import { getTranslations } from "next-intl/server";
import AdminAnalyticsClient from "@/app/components/admin/AdminAnalyticsClient";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import { getAdminAnalyticsDetail } from "@/app/actions/admin-enterprise";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const t = await getTranslations("admin");
  const { analytics, error } = await getAdminAnalyticsDetail();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("analyticsPage.title")}
        description={t("analyticsPage.subtitle")}
      />

      {error || !analytics ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
          {error ?? t("analyticsPage.loadError")}
        </div>
      ) : (
        <AdminAnalyticsClient analytics={analytics} />
      )}
    </div>
  );
}
