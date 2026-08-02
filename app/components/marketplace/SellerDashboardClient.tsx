"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  archiveHorseListing,
  deleteHorseListing,
  duplicateHorseListing,
  markHorseListingSold,
  publishHorseListing,
  restoreHorseListing,
  unpublishHorseListing,
} from "@/app/actions/horse-listings";
import ListingCardActions from "@/app/components/marketplace/ListingCardActions";
import ListingPreview from "@/app/components/sell/ListingPreview";
import {
  formatListingRowPrice,
  getListingCoverImageUrl,
  listingRowToFormData,
  listingImagesFromRow,
} from "@/app/lib/horse-listings";
import type { ListingActionKey } from "@/app/lib/marketplace/listing-actions-config";
import { resolveListingStatus } from "@/app/lib/marketplace/listing-actions-config";
import { resolveListingActionError } from "@/app/lib/marketplace/listing-action-errors";
import { getListingEditPath, getPublicListingPath } from "@/app/lib/marketplace/paths";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { SellerDashboardListingMetrics } from "@/app/types/marketplace-public";
import type { SellerInquiry } from "@/app/types/inquiry";

type Props = {
  dashboard: {
    stats: {
      total: number;
      active: number;
      draft: number;
      sold: number;
      archived: number;
      totalViews: number;
      totalFavorites: number;
      totalInquiries: number;
    };
    listings: HorseListingRow[];
    metricsByListingId: Record<string, SellerDashboardListingMetrics>;
    recentInquiries: SellerInquiry[];
  };
};

const STATUS_STYLES: Record<string, string> = {
  active: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  draft: "text-amber-200 bg-amber-500/10 border-amber-500/30",
  sold: "text-blue-200 bg-blue-500/10 border-blue-500/30",
  archived: "text-gray-300 bg-white/5 border-white/10",
};

type SectionKey = "drafts" | "published" | "sold" | "archived";

export default function SellerDashboardClient({ dashboard }: Props) {
  const t = useTranslations("marketplace");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runListingAction(
    listing: HorseListingRow,
    action: () => Promise<{
      error?: string;
      errorKey?: string;
      data?: HorseListingRow;
      success?: boolean;
      publicUrl?: string;
      editUrl?: string;
    }>
  ) {
    setError(null);
    setPendingId(listing.id);
    startTransition(async () => {
      const result = await action();
      const message = resolveListingActionError(result, t);
      if (message) {
        setError(message);
      } else if (result.publicUrl) {
        router.push(result.publicUrl);
      } else if (result.editUrl) {
        router.push(result.editUrl);
      }
      setPendingId(null);
      router.refresh();
    });
  }

  function handleListingAction(key: ListingActionKey, listing: HorseListingRow) {
    switch (key) {
      case "publish":
        runListingAction(listing, () => publishHorseListing(listing.id));
        break;
      case "unpublish":
        runListingAction(listing, () => unpublishHorseListing(listing.id));
        break;
      case "sold":
        runListingAction(listing, () => markHorseListingSold(listing.id));
        break;
      case "archive":
        runListingAction(listing, () => archiveHorseListing(listing.id));
        break;
      case "restore":
        runListingAction(listing, () => restoreHorseListing(listing.id));
        break;
      case "duplicate":
        runListingAction(listing, () => duplicateHorseListing(listing.id));
        break;
      case "delete":
        runListingAction(listing, () => deleteHorseListing(listing.id));
        break;
      default:
        break;
    }
  }

  const drafts = dashboard.listings.filter((listing) => resolveListingStatus(listing) === "draft");
  const published = dashboard.listings.filter((listing) => resolveListingStatus(listing) === "active");
  const sold = dashboard.listings.filter((listing) => resolveListingStatus(listing) === "sold");
  const archived = dashboard.listings.filter((listing) => resolveListingStatus(listing) === "archived");

  const sections: { key: SectionKey; listings: HorseListingRow[] }[] = [
    { key: "drafts", listings: drafts },
    { key: "published", listings: published },
    { key: "sold", listings: sold },
    { key: "archived", listings: archived },
  ];

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("sellerDashboard.statsPublished")} value={dashboard.stats.active} />
        <StatCard label={t("sellerDashboard.statsDrafts")} value={dashboard.stats.draft} />
        <StatCard label={t("sellerDashboard.statsViews")} value={dashboard.stats.totalViews} />
        <StatCard label={t("sellerDashboard.statsInquiries")} value={dashboard.stats.totalInquiries} />
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label={t("sellerDashboard.statsFavorites")} value={dashboard.stats.totalFavorites} accent />
        <StatCard label={t("sellerDashboard.statsSold")} value={dashboard.stats.sold} accent />
        <StatCard label={t("sellerDashboard.statsArchived")} value={dashboard.stats.archived} accent />
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {sections.map(({ key, listings }) => (
        <ListingGroup
          key={key}
          title={t(`sellerDashboard.sections.${key}.title`)}
          description={t(`sellerDashboard.sections.${key}.description`)}
          listings={listings}
          metricsByListingId={dashboard.metricsByListingId}
          pendingId={pendingId}
          isPending={isPending}
          onAction={handleListingAction}
        />
      ))}

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <h2 className="text-xl font-bold">{t("sellerDashboard.recentInquiries")}</h2>
        {dashboard.recentInquiries.length === 0 ? (
          <p className="mt-4 text-gray-400">{t("sellerDashboard.noInquiries")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {dashboard.recentInquiries.map((inquiry) => (
              <li
                key={inquiry.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <p className="font-semibold text-white">{inquiry.horse_name}</p>
                <p className="text-sm text-gray-400 mt-1">{inquiry.buyer_name}</p>
                <p className="text-sm text-gray-300 mt-2 line-clamp-2">{inquiry.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ListingGroup({
  title,
  description,
  listings,
  metricsByListingId,
  pendingId,
  isPending,
  onAction,
}: {
  title: string;
  description: string;
  listings: HorseListingRow[];
  metricsByListingId: Record<string, SellerDashboardListingMetrics>;
  pendingId: string | null;
  isPending: boolean;
  onAction: (key: ListingActionKey, listing: HorseListingRow) => void;
}) {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
        <p className="text-sm text-gray-500">
          {t("sellerDashboard.listingCount", { count: listings.length })}
        </p>
      </div>

      {listings.length === 0 ? (
        <p className="mt-4 text-gray-400">{t("sellerDashboard.noListingsInSection")}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {listings.map((listing) => {
            const metrics = metricsByListingId[listing.id];
            const busy = isPending && pendingId === listing.id;
            const resolvedStatus = resolveListingStatus(listing);
            const statusClass = STATUS_STYLES[resolvedStatus] ?? STATUS_STYLES.archived;

            return (
              <article
                key={listing.id}
                className="min-w-0 rounded-2xl border border-white/10 bg-[#08111F] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <Image
                        src={getListingCoverImageUrl(listing)}
                        alt={listing.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{listing.name}</h3>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-wide ${statusClass}`}
                        >
                          {t(`sellerDashboard.statusLabels.${resolvedStatus}`)}
                        </span>
                      </div>

                      <p className="text-gray-400 mt-1">
                        {listing.breed} · {listing.discipline} ·{" "}
                        {formatListingRowPrice(listing, tCommon("priceOnRequest"))}
                      </p>

                      <p className="text-xs text-gray-500 mt-2">
                        {t("sellerDashboard.metrics", {
                          views: metrics?.viewCount ?? 0,
                          favorites: metrics?.favoriteCount ?? 0,
                          inquiries: metrics?.inquiryCount ?? 0,
                        })}
                      </p>

                      {resolvedStatus === "active" && listing.slug ? (
                        <Link
                          href={getPublicListingPath(listing.slug)}
                          className="inline-block mt-2 max-w-full truncate text-xs text-emerald-300 hover:text-emerald-200 transition"
                        >
                          {t("sellerDashboard.preview.viewPublic")}
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <ListingCardActions
                    listing={listing}
                    busy={busy}
                    onAction={onAction}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? "border-blue-500/20 bg-blue-500/5" : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export function ListingPreviewActions({
  listing,
}: {
  listing: HorseListingRow;
}) {
  const t = useTranslations("marketplace");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formData = listingRowToFormData(listing);
  const images = listingImagesFromRow(listing);

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishHorseListing(listing.id);
      const message = resolveListingActionError(result, t);
      if (message) {
        setError(message);
        return;
      }
      router.push(result.publicUrl ?? getPublicListingPath(listing.slug));
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <ListingPreview
        data={formData}
        images={images}
        videoFile={null}
        videoPreviewUrl={null}
        existingVideoUrl={listing.video_url}
      />

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href={getListingEditPath(listing.id)}
          className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold transition text-center"
        >
          {t("sellerDashboard.preview.backToEdit")}
        </Link>
        {listing.status !== "active" ? (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-60"
          >
            {isPending ? t("sellerDashboard.preview.publishing") : t("sellerDashboard.preview.publish")}
          </button>
        ) : (
          <Link
            href={getPublicListingPath(listing.slug)}
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition text-center"
          >
            {t("sellerDashboard.preview.viewPublic")}
          </Link>
        )}
      </div>
    </div>
  );
}
