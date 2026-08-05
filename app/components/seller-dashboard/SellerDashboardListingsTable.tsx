"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { memo } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import ListingCardActions from "@/app/components/marketplace/ListingCardActions";
import SellerDashboardEmptyState from "@/app/components/seller-dashboard/SellerDashboardEmptyState";
import {
  formatListingRowPrice,
  getListingCoverImageUrl,
} from "@/app/lib/horse-listings";
import type { ListingActionKey } from "@/app/lib/marketplace/listing-actions-config";
import { resolveListingStatus } from "@/app/lib/marketplace/listing-actions-config";
import { getListingEditPath } from "@/app/lib/marketplace/paths";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { SellerDashboardListingMetrics } from "@/app/types/marketplace-public";

const STATUS_STYLES: Record<string, string> = {
  active: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  draft: "text-amber-200 bg-amber-500/10 border-amber-500/30",
  sold: "text-blue-200 bg-blue-500/10 border-blue-500/30",
  archived: "text-gray-300 bg-white/5 border-white/10",
};

type Props = {
  listings: HorseListingRow[];
  metricsByListingId: Record<string, SellerDashboardListingMetrics>;
  pendingId: string | null;
  isPending: boolean;
  onAction: (key: ListingActionKey, listing: HorseListingRow) => void;
};

function SellerDashboardListingsTable({
  listings,
  metricsByListingId,
  pendingId,
  isPending,
  onAction,
}: Props) {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");

  const sortedListings = [...listings].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <DashboardCard
      eyebrow="Listings"
      title="Your horses"
      description="Manage status, performance, and quick actions from one place."
      action={
        <Link
          href="/sell"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          {t("sellerDashboard.createListing")}
        </Link>
      }
    >
      {sortedListings.length === 0 ? (
        <SellerDashboardEmptyState
          title="No listings yet"
          message="Create your first listing to start reaching buyers on EquiMaster Pro."
          icon="🐴"
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-white/[0.06] lg:block">
            <table className="min-w-full divide-y divide-white/[0.06]">
              <thead className="bg-white/[0.02]">
                <tr>
                  {["Horse", "Status", "Views", "Favorites", "Price", "Actions"].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 first:pl-5 last:pr-5"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {sortedListings.map((listing) => {
                  const metrics = metricsByListingId[listing.id];
                  const resolvedStatus = resolveListingStatus(listing);
                  const statusClass = STATUS_STYLES[resolvedStatus] ?? STATUS_STYLES.archived;
                  const busy = isPending && pendingId === listing.id;

                  return (
                    <tr key={listing.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative h-14 w-[72px] shrink-0 overflow-hidden rounded-xl border border-white/10">
                            <Image
                              src={getListingCoverImageUrl(listing)}
                              alt={listing.name}
                              fill
                              className="object-cover"
                              sizes="72px"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={getListingEditPath(listing.id)}
                              className="block truncate font-semibold text-white transition hover:text-blue-300"
                            >
                              {listing.name}
                            </Link>
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {listing.breed} · {listing.discipline}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass}`}
                        >
                          {t(`sellerDashboard.statusLabels.${resolvedStatus}`)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {metrics?.viewCount ?? 0}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {metrics?.favoriteCount ?? 0}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {formatListingRowPrice(listing, tCommon("priceOnRequest"))}
                      </td>
                      <td className="px-5 py-4">
                        <ListingCardActions listing={listing} busy={busy} onAction={onAction} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 lg:hidden">
            {sortedListings.map((listing) => {
              const metrics = metricsByListingId[listing.id];
              const resolvedStatus = resolveListingStatus(listing);
              const statusClass = STATUS_STYLES[resolvedStatus] ?? STATUS_STYLES.archived;
              const busy = isPending && pendingId === listing.id;

              return (
                <article
                  key={listing.id}
                  className="rounded-2xl border border-white/[0.06] bg-[#08111F]/80 p-4"
                >
                  <div className="flex gap-4">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <Image
                        src={getListingCoverImageUrl(listing)}
                        alt={listing.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-white">{listing.name}</h3>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}
                        >
                          {t(`sellerDashboard.statusLabels.${resolvedStatus}`)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">
                        {formatListingRowPrice(listing, tCommon("priceOnRequest"))}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>{metrics?.viewCount ?? 0} views</span>
                        <span>{metrics?.favoriteCount ?? 0} favorites</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={getListingEditPath(listing.id)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/5"
                    >
                      {t("actions.edit")}
                    </Link>
                    <ListingCardActions listing={listing} busy={busy} onAction={onAction} />
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </DashboardCard>
  );
}

export default memo(SellerDashboardListingsTable);
