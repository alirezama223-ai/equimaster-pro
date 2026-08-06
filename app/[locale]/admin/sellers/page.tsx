import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminSellersClient from "@/app/components/admin/AdminSellersClient";
import { getAdminSellerVerificationQueue } from "@/app/actions/admin-enterprise";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage() {
  const t = await getTranslations("admin");
  const { sellers, error } = await getAdminSellerVerificationQueue();

  return (
    <div className="space-y-8">
      <AdminPageHeader eyebrow={t("adminEyebrow")} title={t("sellers.title")} description={t("sellers.subtitle")} />
      <AdminSellersClient sellers={sellers} error={error} />
    </div>
  );
}
