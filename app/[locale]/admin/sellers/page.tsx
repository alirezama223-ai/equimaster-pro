import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminSellersClient from "@/app/components/admin/AdminSellersClient";
import { getAdminSellers } from "@/app/actions/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage() {
  const t = await getTranslations("admin");
  const { sellers, error } = await getAdminSellers();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("sellers.title")}
        description={t("sellers.subtitle")}
      />
      <AdminSellersClient sellers={sellers} error={error} />
    </div>
  );
}
