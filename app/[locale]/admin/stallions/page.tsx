import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminStallionTable from "@/app/components/admin/AdminStallionTable";
import AdminVerificationFilters from "@/app/components/admin/AdminVerificationControls";
import { getAdminStallions } from "@/app/actions/admin";
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

export default async function AdminStallionsPage({ searchParams }: Props) {
  const t = await getTranslations("admin");
  const { filter: filterParam } = await searchParams;
  const filter = parseFilter(filterParam);
  const { stallions, error } = await getAdminStallions(filter);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("stallions.title")}
        description={t("stallions.subtitle")}
      />

      <AdminVerificationFilters basePath="/admin/stallions" currentFilter={filter} />

      {error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
          {error}
        </div>
      ) : (
        <AdminStallionTable stallions={stallions} />
      )}
    </div>
  );
}
