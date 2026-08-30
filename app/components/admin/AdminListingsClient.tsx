"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useMemo, useState, useTransition } from "react";
import { bulkModerateAdminListings, moderateAdminListingAdvanced } from "@/app/actions/admin-enterprise";
import AdminPagination from "@/app/components/admin/AdminPagination";
import {
  ADMIN_BUTTON_CLASS,
  ADMIN_ERROR_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_TABLE_CLASS,
} from "@/app/components/admin/admin-styles";
import type { AdminListingFilter, AdminListingListItem, AdminListingSort } from "@/app/types/admin-panel";

type Props = {
  listings: AdminListingListItem[];
  filter: AdminListingFilter;
  search: string;
  sort: AdminListingSort;
  page: number;
  hasMore: boolean;
  error?: string;
};

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
    case "paused":
      return "border-orange-500/30 bg-orange-500/15 text-orange-200";
    case "rejected":
      return "border-rose-500/30 bg-rose-500/15 text-rose-200";
    default:
      return "border-white/10 bg-white/5 text-gray-300";
  }
}

function statusLabel(status: string, translate: (key: string) => string): string {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    case "paused":
      return "Paused";
    case "rejected":
      return "Rejected";
    case "draft":
      return "Draft";
    case "sold":
      return "Sold";
    case "archived":
      return "Archived";
    default:
      return translate(`status.${status}`);
  }
}

export default function AdminListingsClient({
  listings,
  filter,
  search,
  sort,
  page,
  hasMore,
  error,
}: Props) {
  const t = useTranslations("admin.listings");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectListingId, setRejectListingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const allSelected = useMemo(
    () => listings.length > 0 && listings.every((listing) => selected.includes(listing.id)),
    [listings, selected]
  );

  function updateQuery(next: {
    filter?: AdminListingFilter;
    search?: string;
    sort?: AdminListingSort;
    page?: number;
  }) {
    const params = new URLSearchParams();
    const nextFilter = next.filter ?? filter;
    const nextSearch = next.search ?? searchInput;
    const nextSort = next.sort ?? sort;
    const nextPage = next.page ?? 1;
    if (nextFilter !== "all") params.set("filter", nextFilter);
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextSort !== "updated") params.set("sort", nextSort);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    router.push(query ? `/admin/listings?${query}` : "/admin/listings");
  }

  function runAction(action: () => Promise<{ error?: string; success?: true }>, optimistic?: () => void) {
    setActionError(null);
    optimistic?.();
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function toggleAll() {
    setSelected(allSelected ? [] : listings.map((listing) => listing.id));
  }

  function toggleOne(listingId: string) {
    setSelected((current) =>
      current.includes(listingId) ? current.filter((id) => id !== listingId) : [...current, listingId]
    );
  }

  function formatDate(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="flex flex-col gap-2 text-sm text-gray-400">
          {t("searchLabel")}
          <div className="flex gap-2">
            <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t("searchPlaceholder")} className={ADMIN_INPUT_CLASS} disabled={isPending} />
            <button type="button" className={ADMIN_PRIMARY_BUTTON_CLASS} disabled={isPending} onClick={() => updateQuery({ search: searchInput, page: 1 })}>{t("searchAction")}</button>
          </div>
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-400">
          {t("filterLabel")}
          <select value={filter} onChange={(event) => updateQuery({ filter: event.target.value as AdminListingFilter, page: 1 })} className={ADMIN_SELECT_CLASS} disabled={isPending}>
            <option value="all">{t("filters.all")}</option>
            <option value="pending">{t("filters.pending")}</option>
            <option value="active">{t("filters.active")}</option>
            <option value="rejected">{t("filters.rejected")}</option>
            <option value="draft">{t("filters.draft")}</option>
            <option value="featured">{t("filters.featured")}</option>
            <option value="hidden">{t("filters.hidden")}</option>
            <option value="archived">{t("filters.archived")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-400">
          {t("sortLabel")}
          <select value={sort} onChange={(event) => updateQuery({ sort: event.target.value as AdminListingSort, page: 1 })} className={ADMIN_SELECT_CLASS} disabled={isPending}>
            <option value="updated">{t("sort.updated")}</option>
            <option value="newest">{t("sort.newest")}</option>
            <option value="oldest">{t("sort.oldest")}</option>
            <option value="most_views">{t("sort.mostViews")}</option>
          </select>
        </label>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-[#111827] p-4">
          <span className="self-center text-sm text-gray-400">{t("bulk.selected", { count: selected.length })}</span>
          <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => bulkModerateAdminListings(selected, "approve"))}>{t("bulk.approve")}</button>
          <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => bulkModerateAdminListings(selected, "archive"))}>{t("bulk.archive")}</button>
          <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => bulkModerateAdminListings(selected, "feature"))}>{t("bulk.feature")}</button>
          <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => bulkModerateAdminListings(selected, "hide"))}>{t("bulk.hide")}</button>
          <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => bulkModerateAdminListings(selected, "delete"))}>{t("bulk.delete")}</button>
        </div>
      ) : null}

      {(error || actionError) ? <div className={ADMIN_ERROR_CLASS}>{error ?? actionError}</div> : null}

      {listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">{t("empty")}</div>
      ) : (
        <div className={ADMIN_TABLE_CLASS}>
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-[#0B1424] text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-4"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t("bulk.selectAll")} /></th>
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
                  <td className="px-4 py-4"><input type="checkbox" checked={selected.includes(listing.id)} onChange={() => toggleOne(listing.id)} aria-label={listing.name} /></td>
                  <td className="min-w-[220px] px-4 py-4">
                    <p className="font-semibold text-white">{listing.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{listing.breed} · {listing.country} · {listing.priceLabel}</p>
                    {listing.rejectionReason ? <p className="mt-1 text-xs text-rose-300">{listing.rejectionReason}</p> : null}
                    <Link href={`/horses/${listing.slug}`} className="mt-1 inline-block text-xs text-blue-400 hover:text-blue-300">{t("viewPublic")}</Link>
                  </td>
                  <td className="px-4 py-4"><p className="text-white">{listing.sellerName}</p><p className="mt-1 font-mono text-xs text-gray-500">{listing.sellerReference}</p></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(listing.status)}`}>{statusLabel(listing.status, t)}</span>
                      {listing.featured ? <span className="inline-flex w-fit rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-200">{t("featuredBadge")}</span> : null}
                      {listing.hidden ? <span className="inline-flex w-fit rounded-full border border-gray-500/30 bg-gray-500/15 px-2.5 py-1 text-xs font-semibold text-gray-300">{t("hiddenBadge")}</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300">{listing.viewCount}</td>
                  <td className="px-4 py-4 text-gray-400">{formatDate(listing.updatedAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-[260px] flex-wrap gap-2">
                      <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => moderateAdminListingAdvanced(listing.id, "approve"))}>{t("actions.approve")}</button>
                      <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => setRejectListingId(listing.id)}>{t("actions.reject")}</button>
                      <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => moderateAdminListingAdvanced(listing.id, "toggle_featured"))}>{listing.featured ? t("actions.unfeature") : t("actions.feature")}</button>
                      <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => moderateAdminListingAdvanced(listing.id, "toggle_hidden"))}>{listing.hidden ? t("actions.unhide") : t("actions.hide")}</button>
                      <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(() => moderateAdminListingAdvanced(listing.id, "delete"))}>{t("actions.delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectListingId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#111827] p-6">
            <h3 className="text-lg font-bold text-white">{t("rejectTitle")}</h3>
            <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={4} className={`${ADMIN_INPUT_CLASS} mt-4`} placeholder={t("rejectPlaceholder")} />
            <div className="mt-4 flex gap-2">
              <button type="button" className={ADMIN_PRIMARY_BUTTON_CLASS} disabled={isPending} onClick={() => runAction(async () => moderateAdminListingAdvanced(rejectListingId, "reject", rejectReason), () => { setRejectListingId(null); setRejectReason(""); })}>{t("actions.reject")}</button>
              <button type="button" className={ADMIN_BUTTON_CLASS} onClick={() => { setRejectListingId(null); setRejectReason(""); }}>{t("actions.cancel")}</button>
            </div>
          </div>
        </div>
      ) : null}

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
