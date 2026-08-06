import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminUsersClient from "@/app/components/admin/AdminUsersClient";
import { getAdminUsers } from "@/app/actions/admin-panel";
import type { AdminUserFilter } from "@/app/types/admin-panel";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ filter?: string; page?: string }>;
};

function parseFilter(value: string | undefined): AdminUserFilter {
  if (value === "admin" || value === "seller" || value === "verified_seller") {
    return value;
  }
  return "all";
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const t = await getTranslations("admin");
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const page = parsePage(params.page);
  const { users, hasMore, error } = await getAdminUsers(page, filter);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("users.title")}
        description={t("users.subtitle")}
      />
      <AdminUsersClient users={users} filter={filter} page={page} hasMore={hasMore} error={error} />
    </div>
  );
}
