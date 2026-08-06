import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminSettingsClient from "@/app/components/admin/AdminSettingsClient";
import { getAdminSettings } from "@/app/actions/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const t = await getTranslations("admin");
  const { settings, error } = await getAdminSettings();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />
      <AdminSettingsClient settings={settings} error={error} />
    </div>
  );
}
