import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminBreederTable from "@/app/components/admin/AdminBreederTable";
import AdminVerificationFilters from "@/app/components/admin/AdminVerificationControls";
import { getAdminBreeders } from "@/app/actions/admin";
import type { AdminVerificationFilter } from "@/app/lib/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

function parseFilter(value: string | undefined): AdminVerificationFilter {
  if (value === "verified" || value === "pending") {
    return value;
  }

  return "all";
}

export default async function AdminBreedersPage({ searchParams }: Props) {
  const t = await getTranslations("admin");
  const { filter: filterParam } = await searchParams;
  const filter = parseFilter(filterParam);
  const { breeders, error } = await getAdminBreeders(filter);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("breeders.title")}
        description={t("breeders.subtitle")}
      />

      <AdminVerificationFilters basePath="/admin/breeders" currentFilter={filter} />

      {error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
          {error}
        </div>
      ) : (
        <AdminBreederTable breeders={breeders} />
      )}
    </div>
  );
}
