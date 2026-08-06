import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminListingsClient from "@/app/components/admin/AdminListingsClient";
import { getAdminListings } from "@/app/actions/admin-panel";
import type { AdminListingFilter, AdminListingSort } from "@/app/types/admin-panel";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ filter?: string; q?: string; sort?: string; page?: string }>;
};

function parseFilter(value: string | undefined): AdminListingFilter {
  const allowed: AdminListingFilter[] = ["all", "active", "draft", "sold", "archived", "pending", "rejected", "featured", "hidden"];
  return allowed.includes(value as AdminListingFilter) ? (value as AdminListingFilter) : "all";
}

function parseSort(value: string | undefined): AdminListingSort {
  return value === "newest" || value === "oldest" || value === "most_views" ? value : "updated";
}

export default async function AdminListingsPage({ searchParams }: Props) {
  const t = await getTranslations("admin");
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const search = params.q ?? "";
  const sort = parseSort(params.sort);
  const page = Math.max(Number(params.page) || 1, 1);
  const { listings, hasMore, error } = await getAdminListings(page, filter, search, sort);

  return (
    <div className="space-y-8">
      <AdminPageHeader eyebrow={t("adminEyebrow")} title={t("listings.title")} description={t("listings.subtitle")} />
      <AdminListingsClient listings={listings} filter={filter} search={search} sort={sort} page={page} hasMore={hasMore} error={error} />
    </div>
  );
}
