"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { moderateAdminListing } from "@/app/actions/admin-panel";
import type { AdminListingFilter, AdminListingListItem } from "@/app/types/admin-panel";

type Props = {
  listings: AdminListingListItem[];
  filter: AdminListingFilter;
  search: string;
  page: number;
  hasMore: boolean;
  error?: string;
};

const selectClassName =
  "rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none";

const buttonClassName =
  "rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-blue-500/40 disabled:opacity-50";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
    case "draft":
      return "border-amber-500/30 bg-amber-500/15 text-amber-200";
    case "sold":
      return "border-blue-500/30 bg-blue-500/15 text-blue-200";
    case "archived":
      return "border-gray-500/30 bg-gray-500/15 text-gray-300";
    default:
      return "border-white/10 bg-white/5 text-gray-300";
  }
}

export default function AdminListingsClient({
  listings,
  filter,
  search,
  page,
  hasMore,
  error,
}: Props) {
  const t = useTranslations("admin.listings");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);
  const [actionError, setActionError] = useState<string | null>(null);

  function updateQuery(nextFilter: AdminListingFilter, nextSearch: string, nextPage = 1) {
    const params = new URLSearchParams();
    if (nextFilter !== "all") params.set("filter", nextFilter);
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    router.push(query ? `/admin/listings?${query}` : "/admin/listings");
  }

  function handleModeration(listingId: string, action: "approve" | "archive" | "restore" | "toggle_verified") {
    setActionError(null);
    startTransition(async () => {
      const result = await moderateAdminListing(listingId, action);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function formatDate(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="flex flex-col gap-2 text-sm text-gray-400">
          {t("searchLabel")}
          <div className="flex gap-2">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className={inputClassName}
              disabled={isPending}
            />
            <button
              type="button"
              className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              disabled={isPending}
              onClick={() => updateQuery(filter, searchInput, 1)}
            >
              {t("searchAction")}
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-400">
          {t("filterLabel")}
          <select
            value={filter}
            onChange={(event) => updateQuery(event.target.value as AdminListingFilter, searchInput, 1)}
            className={selectClassName}
            disabled={isPending}
          >
            <option value="all">{t("filters.all")}</option>
            <option value="active">{t("filters.active")}</option>
            <option value="draft">{t("filters.draft")}</option>
            <option value="sold">{t("filters.sold")}</option>
            <option value="archived">{t("filters.archived")}</option>
          </select>
        </label>
      </div>

      {error || actionError ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200">
          {error ?? actionError}
        </div>
      ) : null}

      {listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-[#0B1424] text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-4">{t("columns.listing")}</th>
                <th className="px-4 py-4">{t("columns.seller")}</th>
                <th className="px-4 py-4">{t("columns.status")}</th>
                <th className="px-4 py-4">{t("columns.views")}</th>
                <th className="px-4 py-4">{t("columns.updated")}</th>
                <th className="px-4 py-4">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-[#111827]">
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-4 py-4 min-w-[220px]">
                    <p className="font-semibold text-white">{listing.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {listing.breed} · {listing.country} · {listing.priceLabel}
                    </p>
                    <Link
                      href={`/horses/${listing.slug}`}
                      className="mt-1 inline-block text-xs text-blue-400 hover:text-blue-300"
                    >
                      {t("viewPublic")}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-white">{listing.sellerName}</p>
                    <p className="mt-1 font-mono text-xs text-gray-500">{listing.sellerReference}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(listing.status)}`}
                      >
                        {t(`status.${listing.status as "active" | "draft" | "sold" | "archived"}`)}
                      </span>
                      {listing.verified ? (
                        <span className="inline-flex w-fit rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                          {t("verifiedBadge")}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300">{listing.viewCount}</td>
                  <td className="px-4 py-4 text-gray-400">{formatDate(listing.updatedAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-[220px] flex-wrap gap-2">
                      {listing.status !== "active" ? (
                        <button
                          type="button"
                          className={buttonClassName}
                          disabled={isPending}
                          onClick={() => handleModeration(listing.id, "approve")}
                        >
                          {t("actions.approve")}
                        </button>
                      ) : null}
                      {listing.status === "archived" ? (
                        <button
                          type="button"
                          className={buttonClassName}
                          disabled={isPending}
                          onClick={() => handleModeration(listing.id, "restore")}
                        >
                          {t("actions.restore")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={buttonClassName}
                          disabled={isPending}
                          onClick={() => handleModeration(listing.id, "archive")}
                        >
                          {t("actions.archive")}
                        </button>
                      )}
                      <button
                        type="button"
                        className={buttonClassName}
                        disabled={isPending}
                        onClick={() => handleModeration(listing.id, "toggle_verified")}
                      >
                        {listing.verified ? t("actions.unverify") : t("actions.verify")}
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
          onClick={() => updateQuery(filter, searchInput, page - 1)}
        >
          {t("pagination.previous")}
        </button>
        <p className="text-sm text-gray-500">{t("pagination.page", { page })}</p>
        <button
          type="button"
          className={buttonClassName}
          disabled={isPending || !hasMore}
          onClick={() => updateQuery(filter, searchInput, page + 1)}
        >
          {t("pagination.next")}
        </button>
      </div>
    </div>
  );
}
