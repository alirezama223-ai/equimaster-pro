import AdvertisementManager from "@/app/components/admin/AdvertisementManager";
import AdvertisementReporting from "@/app/components/admin/AdvertisementReporting";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import { getAdminAdvertisements, getAdminAdvertisementReport } from "@/app/actions/advertisements";

export const dynamic = "force-dynamic";

export default async function AdminAdvertisementsPage() {
  const [{ advertisements, error }, report] = await Promise.all([
    getAdminAdvertisements(),
    getAdminAdvertisementReport(),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin"
        title="Homepage Advertisements"
        description="Create, review, activate, and measure paid campaigns across the three homepage advertising placements."
      />
      {error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">{error}</div>
      ) : (
        <>
          <AdvertisementReporting advertisements={report.advertisements} />
          <AdvertisementManager initialAds={advertisements} />
          {report.error && <p className="text-sm text-amber-300">Reporting data could not be loaded: {report.error}</p>}
        </>
      )}
    </div>
  );
}
