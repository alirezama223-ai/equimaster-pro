"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import {
  deleteAdminUser,
  setAdminUserAccountStatus,
} from "@/app/actions/admin-enterprise";
import { setAdminSellerVerified, setAdminUserRole } from "@/app/actions/admin-panel";
import { formatOwnerReference } from "@/app/lib/format-owner-reference";
import AdminPagination from "@/app/components/admin/AdminPagination";
import {
  ADMIN_BUTTON_CLASS,
  ADMIN_ERROR_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_TABLE_CLASS,
} from "@/app/components/admin/admin-styles";
import type { AdminUserFilter, AdminUserListItem, AdminUserSort } from "@/app/types/admin-panel";

type Props = {
  users: AdminUserListItem[];
  filter: AdminUserFilter;
  search: string;
  sort: AdminUserSort;
  page: number;
  hasMore: boolean;
  error?: string;
};

export default function AdminUsersClient({
  users,
  filter,
  search,
  sort,
  page,
  hasMore,
  error,
}: Props) {
  const t = useTranslations("admin.users");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);
  const [actionError, setActionError] = useState<string | null>(null);

  function updateQuery(next: { filter?: AdminUserFilter; search?: string; sort?: AdminUserSort; page?: number }) {
    const params = new URLSearchParams();
    const nextFilter = next.filter ?? filter;
    const nextSearch = next.search ?? searchInput;
    const nextSort = next.sort ?? sort;
    const nextPage = next.page ?? 1;
    if (nextFilter !== "all") params.set("filter", nextFilter);
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextSort !== "newest") params.set("sort", nextSort);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    router.push(query ? `/admin/users?${query}` : "/admin/users");
  }

  function runAction(action: () => Promise<{ error?: string; success?: true }>) {
    setActionError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="flex flex-col gap-2 text-sm text-gray-400">
          {t("searchLabel")}
          <div className="flex gap-2">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className={ADMIN_INPUT_CLASS}
              disabled={isPending}
            />
            <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => updateQuery({ search: searchInput, page: 1 })}>
              {t("searchAction")}
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-400">
          {t("filterLabel")}
          <select value={filter} onChange={(event) => updateQuery({ filter: event.target.value as AdminUserFilter, page: 1 })} className={ADMIN_SELECT_CLASS} disabled={isPending}>
            <option value="all">{t("filters.all")}</option>
            <option value="admin">{t("filters.admin")}</option>
            <option value="seller">{t("filters.seller")}</option>
            <option value="verified_seller">{t("filters.verifiedSeller")}</option>
            <option value="pending_verification">{t("filters.pendingVerification")}</option>
            <option value="suspended">{t("filters.suspended")}</option>
            <option value="banned">{t("filters.banned")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-400">
          {t("sortLabel")}
          <select value={sort} onChange={(event) => updateQuery({ sort: event.target.value as AdminUserSort, page: 1 })} className={ADMIN_SELECT_CLASS} disabled={isPending}>
            <option value="newest">{t("sort.newest")}</option>
            <option value="oldest">{t("sort.oldest")}</option>
            <option value="most_listings">{t("sort.mostListings")}</option>
          </select>
        </label>
      </div>

      {(error || actionError) ? <div className={ADMIN_ERROR_CLASS}>{error ?? actionError}</div> : null}

      {users.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">{t("empty")}</div>
      ) : (
        <div className={ADMIN_TABLE_CLASS}>
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-[#0B1424] text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-4">{t("columns.user")}</th>
                <th className="px-4 py-4">{t("columns.role")}</th>
                <th className="px-4 py-4">{t("columns.status")}</th>
                <th className="px-4 py-4">{t("columns.country")}</th>
                <th className="px-4 py-4">{t("columns.seller")}</th>
                <th className="px-4 py-4">{t("columns.listings")}</th>
                <th className="px-4 py-4">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-[#111827]">
              {users.map((user) => (
                <tr key={user.userId}>
                  <td className="px-4 py-4 font-mono text-xs text-gray-300">{formatOwnerReference(user.userId)}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "border-violet-500/30 bg-violet-500/15 text-violet-200" : "border-white/10 bg-white/5 text-gray-300"}`}>
                      {user.role === "admin" ? t("roles.admin") : t("roles.user")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${user.accountStatus === "active" ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200" : user.accountStatus === "suspended" ? "border-amber-500/30 bg-amber-500/15 text-amber-200" : "border-rose-500/30 bg-rose-500/15 text-rose-200"}`}>
                      {t(`accountStatus.${user.accountStatus}`)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-400">{user.country ?? "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${user.sellerVerified ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200" : "border-amber-500/30 bg-amber-500/15 text-amber-200"}`}>
                      {user.sellerVerified ? t("sellerVerified") : t("sellerPending")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-300">{t("listingCounts", { total: user.listingCount, active: user.activeListingCount })}</td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-[260px] flex-wrap gap-2">
                      <Link href={`/account`} className={ADMIN_BUTTON_CLASS}>{t("actions.openProfile")}</Link>
                      {user.role === "admin" ? (
                        <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => setAdminUserRole(user.userId, "user"))}>{t("actions.revokeAdmin")}</button>
                      ) : (
                        <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => setAdminUserRole(user.userId, "admin"))}>{t("actions.makeAdmin")}</button>
                      )}
                      {user.accountStatus !== "suspended" ? (
                        <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => setAdminUserAccountStatus(user.userId, "suspended"))}>{t("actions.suspend")}</button>
                      ) : (
                        <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => setAdminUserAccountStatus(user.userId, "active"))}>{t("actions.activate")}</button>
                      )}
                      <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => deleteAdminUser(user.userId))}>{t("actions.ban")}</button>
                      <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => setAdminSellerVerified(user.userId, !user.sellerVerified))}>
                        {user.sellerVerified ? t("actions.unverifySeller") : t("actions.verifySeller")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination
        page={page}
        hasMore={hasMore}
        disabled={isPending}
        previousLabel={t("pagination.previous")}
        nextLabel={t("pagination.next")}
        pageLabel={t("pagination.page", { page })}
        onPrevious={() => updateQuery({ page: page - 1 })}
        onNext={() => updateQuery({ page: page + 1 })}
      />
    </div>
  );
}
