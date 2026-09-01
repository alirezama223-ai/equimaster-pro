import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdvertisementManager from "@/app/components/admin/AdvertisementManager";
import { getAdminAdvertisements } from "@/app/actions/advertisements";

export const dynamic = "force-dynamic";

export default async function AdminAdvertisementsPage() {
  const t = await getTranslations("admin");
  const { advertisements, error } = await getAdminAdvertisements();

  return <div className="space-y-8">
    <AdminPageHeader
      eyebrow="SHABDIZ ADMIN"
      title="Advertisements"
      description="Create, schedule and manage sponsored campaigns across Shabdiz."
    />
    {error ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{error}</div> : <AdvertisementManager initialAds={advertisements} />}
  </div>;
}
