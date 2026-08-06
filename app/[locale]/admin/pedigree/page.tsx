import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminPedigreeTable from "@/app/components/admin/AdminPedigreeTable";
import AdminVerificationFilters from "@/app/components/admin/AdminVerificationControls";
import { getAdminPedigreeRecords } from "@/app/actions/pedigree";
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

export default async function AdminPedigreePage({ searchParams }: Props) {
  const t = await getTranslations("admin");
  const { filter: filterParam } = await searchParams;
  const filter = parseFilter(filterParam);
  const { records, error } = await getAdminPedigreeRecords(filter);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("pedigree.title")}
        description={t("pedigree.subtitle")}
      />

      <AdminVerificationFilters basePath="/admin/pedigree" currentFilter={filter} />

      {error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
          {error}
        </div>
      ) : (
        <AdminPedigreeTable records={records} />
      )}
    </div>
  );
}
