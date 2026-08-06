import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminSubscriptionsClient from "@/app/components/admin/AdminSubscriptionsClient";
import {
  getAdminPlans,
  getAdminSubscriptionStats,
  getAdminSubscriptions,
} from "@/app/actions/admin-subscriptions";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const t = await getTranslations("subscription.admin");
  const tAdmin = await getTranslations("admin");
  const [statsResult, subscriptionsResult, plansResult] = await Promise.all([
    getAdminSubscriptionStats(),
    getAdminSubscriptions(),
    getAdminPlans(),
  ]);

  if (!statsResult.stats) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          eyebrow={tAdmin("adminEyebrow")}
          title={t("title")}
          description={t("subtitle")}
        />
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
          {statsResult.error ?? t("noCustomers")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={tAdmin("adminEyebrow")}
        title={t("title")}
        description={t("subtitle")}
      />
      <AdminSubscriptionsClient
        stats={statsResult.stats}
        subscriptions={subscriptionsResult.subscriptions}
        plans={plansResult.plans}
        error={statsResult.error ?? subscriptionsResult.error ?? plansResult.error}
      />
    </div>
  );
}
