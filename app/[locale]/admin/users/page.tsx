import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminUsersClient from "@/app/components/admin/AdminUsersClient";
import { getAdminUsers } from "@/app/actions/admin-panel";
import type { AdminUserFilter, AdminUserSort } from "@/app/types/admin-panel";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ filter?: string; q?: string; sort?: string; page?: string }>;
};

function parseFilter(value: string | undefined): AdminUserFilter {
  const allowed: AdminUserFilter[] = ["all", "admin", "seller", "verified_seller", "suspended", "banned", "pending_verification"];
  return allowed.includes(value as AdminUserFilter) ? (value as AdminUserFilter) : "all";
}

function parseSort(value: string | undefined): AdminUserSort {
  return value === "oldest" || value === "most_listings" ? value : "newest";
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const t = await getTranslations("admin");
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const search = params.q ?? "";
  const sort = parseSort(params.sort);
  const page = Math.max(Number(params.page) || 1, 1);
  const { users, hasMore, error } = await getAdminUsers(page, filter, search, sort);

  return (
    <div className="space-y-8">
      <AdminPageHeader eyebrow={t("adminEyebrow")} title={t("users.title")} description={t("users.subtitle")} />
      <AdminUsersClient users={users} filter={filter} search={search} sort={sort} page={page} hasMore={hasMore} error={error} />
    </div>
  );
}
