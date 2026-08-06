import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminListingsClient from "@/app/components/admin/AdminListingsClient";
import { getAdminListings } from "@/app/actions/admin-panel";
import type { AdminListingFilter } from "@/app/types/admin-panel";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ filter?: string; q?: string; page?: string }>;
};

function parseFilter(value: string | undefined): AdminListingFilter {
  if (value === "active" || value === "draft" || value === "sold" || value === "archived") {
    return value;
  }
  return "all";
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminListingsPage({ searchParams }: Props) {
  const t = await getTranslations("admin");
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const search = params.q ?? "";
  const page = parsePage(params.page);
  const { listings, hasMore, error } = await getAdminListings(page, filter, search);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("listings.title")}
        description={t("listings.subtitle")}
      />
      <AdminListingsClient
        listings={listings}
        filter={filter}
        search={search}
        page={page}
        hasMore={hasMore}
        error={error}
      />
    </div>
  );
}
