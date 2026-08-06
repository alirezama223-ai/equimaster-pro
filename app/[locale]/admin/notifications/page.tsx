import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminNotificationsClient from "@/app/components/admin/AdminNotificationsClient";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const t = await getTranslations("admin");

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("notifications.title")}
        description={t("notifications.subtitle")}
      />
      <AdminNotificationsClient />
    </div>
  );
}
