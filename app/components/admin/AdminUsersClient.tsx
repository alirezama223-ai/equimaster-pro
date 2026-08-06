"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { setAdminSellerVerified, setAdminUserRole } from "@/app/actions/admin-panel";
import { formatOwnerReference } from "@/app/lib/format-owner-reference";
import type { AdminUserFilter, AdminUserListItem } from "@/app/types/admin-panel";

type Props = {
  users: AdminUserListItem[];
  filter: AdminUserFilter;
  page: number;
  hasMore: boolean;
  error?: string;
};

const selectClassName =
  "rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none";

const buttonClassName =
  "rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-blue-500/40 disabled:opacity-50";

export default function AdminUsersClient({ users, filter, page, hasMore, error }: Props) {
  const t = useTranslations("admin.users");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function updateQuery(nextFilter: AdminUserFilter, nextPage = 1) {
    const params = new URLSearchParams();
    if (nextFilter !== "all") params.set("filter", nextFilter);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    router.push(query ? `/admin/users?${query}` : "/admin/users");
  }

  function handleRoleChange(userId: string, role: "user" | "admin") {
    setActionError(null);
    startTransition(async () => {
      const result = await setAdminUserRole(userId, role);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleSellerVerifiedChange(userId: string, sellerVerified: boolean) {
    setActionError(null);
    startTransition(async () => {
      const result = await setAdminSellerVerified(userId, sellerVerified);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-col gap-2 text-sm text-gray-400">
          {t("filterLabel")}
          <select
            value={filter}
            onChange={(event) => updateQuery(event.target.value as AdminUserFilter)}
            className={selectClassName}
            disabled={isPending}
          >
            <option value="all">{t("filters.all")}</option>
            <option value="admin">{t("filters.admin")}</option>
            <option value="seller">{t("filters.seller")}</option>
            <option value="verified_seller">{t("filters.verifiedSeller")}</option>
          </select>
        </label>
      </div>

      {error || actionError ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200">
          {error ?? actionError}
        </div>
      ) : null}

      {users.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-[#0B1424] text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-4">{t("columns.user")}</th>
                <th className="px-4 py-4">{t("columns.role")}</th>
                <th className="px-4 py-4">{t("columns.seller")}</th>
                <th className="px-4 py-4">{t("columns.listings")}</th>
                <th className="px-4 py-4">{t("columns.joined")}</th>
                <th className="px-4 py-4">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-[#111827]">
              {users.map((user) => (
                <tr key={user.userId}>
                  <td className="px-4 py-4 font-mono text-xs text-gray-300">
                    {formatOwnerReference(user.userId)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        user.role === "admin"
                          ? "border-violet-500/30 bg-violet-500/15 text-violet-200"
                          : "border-white/10 bg-white/5 text-gray-300"
                      }`}
                    >
                      {user.role === "admin" ? t("roles.admin") : t("roles.user")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        user.sellerVerified
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                          : "border-amber-500/30 bg-amber-500/15 text-amber-200"
                      }`}
                    >
                      {user.sellerVerified ? t("sellerVerified") : t("sellerPending")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-300">
                    {t("listingCounts", {
                      total: user.listingCount,
                      active: user.activeListingCount,
                    })}
                  </td>
                  <td className="px-4 py-4 text-gray-400">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.role === "admin" ? (
                        <button
                          type="button"
                          className={buttonClassName}
                          disabled={isPending}
                          onClick={() => handleRoleChange(user.userId, "user")}
                        >
                          {t("actions.revokeAdmin")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={buttonClassName}
                          disabled={isPending}
                          onClick={() => handleRoleChange(user.userId, "admin")}
                        >
                          {t("actions.makeAdmin")}
                        </button>
                      )}
                      <button
                        type="button"
                        className={buttonClassName}
                        disabled={isPending}
                        onClick={() => handleSellerVerifiedChange(user.userId, !user.sellerVerified)}
                      >
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

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className={buttonClassName}
          disabled={isPending || page <= 1}
          onClick={() => updateQuery(filter, page - 1)}
        >
          {t("pagination.previous")}
        </button>
        <p className="text-sm text-gray-500">{t("pagination.page", { page })}</p>
        <button
          type="button"
          className={buttonClassName}
          disabled={isPending || !hasMore}
          onClick={() => updateQuery(filter, page + 1)}
        >
          {t("pagination.next")}
        </button>
      </div>
    </div>
  );
}
