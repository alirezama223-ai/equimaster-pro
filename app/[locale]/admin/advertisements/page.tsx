import AdvertisementManager from "@/app/components/admin/AdvertisementManager";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import { getAdminAdvertisements } from "@/app/actions/advertisements";

export const dynamic = "force-dynamic";

export default async function AdminAdvertisementsPage() {
  const { advertisements, error } = await getAdminAdvertisements();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin"
        title="Homepage Advertisements"
        description="Create, review, and activate paid campaigns for the three homepage advertising placements."
      />
      {error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">{error}</div>
      ) : (
        <AdvertisementManager initialAds={advertisements} />
      )}
    </div>
  );
}
