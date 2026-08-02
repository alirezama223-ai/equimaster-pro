"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import {
  deleteHorseListing,
  markHorseListingSold,
  publishHorseListing,
  unpublishHorseListing,
  archiveHorseListing,
} from "@/app/actions/horse-listings";
import {
  formatListingRowPrice,
  getListingCoverImageUrl,
} from "@/app/lib/horse-listings";
import { getListingEditPath, getListingPreviewPath, getPublicListingPath } from "@/app/lib/marketplace/paths";
import { resolveListingActionError } from "@/app/lib/marketplace/listing-action-errors";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { SellerListingStats } from "@/app/types/marketplace";

type Props = {
  listings: HorseListingRow[];
  stats: SellerListingStats;
};

const STATUS_STYLES: Record<string, string> = {
  active: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  draft: "text-amber-200 bg-amber-500/10 border-amber-500/30",
  sold: "text-blue-200 bg-blue-500/10 border-blue-500/30",
  archived: "text-gray-300 bg-white/5 border-white/10",
};

export default function SellerListingsDashboard({ listings: initialListings, stats }: Props) {
  const t = useTranslations("account.sellerListings");
  const tMarketplace = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const statusLabels: Record<string, string> = {
    active: t("statusActive"),
    draft: t("statusDraft"),
    sold: t("statusSold"),
    archived: t("statusArchived"),
  };

  function updateListing(next: HorseListingRow) {
    setListings((current) =>
      current.map((listing) => (listing.id === next.id ? next : listing))
    );
  }

  function runAction(
    listingId: string,
    action: () => Promise<{ error?: string; errorKey?: string; data?: HorseListingRow; success?: boolean }>
  ) {
    setError(null);
    setPendingId(listingId);
    startTransition(async () => {
      const result = await action();
      const message = resolveListingActionError(result, tMarketplace);
      if (message) {
        setError(message);
      } else if (result.data) {
        updateListing(result.data);
      } else if (result.success) {
        setListings((current) => current.filter((listing) => listing.id !== listingId));
      }
      setPendingId(null);
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl bg-[#111827] border border-white/10 p-6 md:col-span-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="uppercase tracking-[6px] text-blue-500 text-xs font-semibold">
            {t("eyebrow")}
          </p>
          <h2 className="text-2xl font-black text-white mt-3">{t("title")}</h2>
          <p className="mt-2 text-gray-400">{t("subtitle")}</p>
        </div>
        <Link
          href="/sell"
          className="inline-flex justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition"
        >
          {t("createListing")}
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t("statsTotal")} value={stats.total} />
        <StatCard label={t("statsLive")} value={stats.active} accent="emerald" />
        <StatCard label={t("statsDrafts")} value={stats.draft} accent="amber" />
        <StatCard label={t("statsSold")} value={stats.sold} accent="blue" />
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {listings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {listings.map((listing) => {
            const isBusy = isPending && pendingId === listing.id;
            const statusClass = STATUS_STYLES[listing.status] ?? STATUS_STYLES.archived;

            return (
              <article
                key={listing.id}
                className="rounded-2xl bg-[#08111F] border border-white/10 p-5 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="flex gap-4 min-w-0">
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10">
                    <Image
                      src={getListingCoverImageUrl(listing)}
                      alt={listing.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-white font-semibold text-lg">{listing.name}</p>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-wide ${statusClass}`}
                      >
                        {statusLabels[listing.status] ?? t("statusUnknown")}
                      </span>
                    </div>
                    <p className="text-gray-400 mt-1">
                      {listing.breed} · {listing.discipline} · {listing.level}
                    </p>
                    <p className="text-blue-400 mt-2 font-semibold">
                      {formatListingRowPrice(listing, tCommon("priceOnRequest"))}
                    </p>
                    {listing.pedigree_horse_id ? (
                      <Link
                        href={`/pedigree/${listing.pedigree_horse_id}`}
                        className="inline-block mt-2 text-xs text-gray-400 hover:text-blue-300 transition"
                      >
                        {t("viewPedigree")}
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={
                      listing.status === "active"
                        ? getPublicListingPath(listing.slug)
                        : getListingPreviewPath(listing.id)
                    }
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                  >
                    {listing.status === "active" ? t("viewPublicPage") : t("preview")}
                  </Link>
                  <Link
                    href={getListingEditPath(listing.id)}
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                  >
                    {tCommon("edit")}
                  </Link>
                  {listing.status === "draft" || listing.status === "sold" ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => runAction(listing.id, () => publishHorseListing(listing.id))}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                    >
                      {t("publish")}
                    </button>
                  ) : null}
                  {listing.status === "active" ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => runAction(listing.id, () => unpublishHorseListing(listing.id))}
                      className="rounded-xl border border-amber-500/40 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/10 transition disabled:opacity-60"
                    >
                      {t("unpublish")}
                    </button>
                  ) : null}
                  {listing.status === "active" ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => runAction(listing.id, () => markHorseListingSold(listing.id))}
                      className="rounded-xl border border-blue-500/40 px-4 py-2 text-sm text-blue-100 hover:bg-blue-500/10 transition disabled:opacity-60"
                    >
                      {t("markSold")}
                    </button>
                  ) : null}
                  {listing.status !== "archived" ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => runAction(listing.id, () => archiveHorseListing(listing.id))}
                      className="rounded-xl border border-white/20 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition disabled:opacity-60"
                    >
                      {t("archive")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      if (!window.confirm(t("deleteConfirm"))) return;
                      runAction(listing.id, () => deleteHorseListing(listing.id));
                    }}
                    className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 transition disabled:opacity-60"
                  >
                    {tCommon("delete")}
                  </button>
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
  accent?: "emerald" | "amber" | "blue";
}) {
  const accentClass =
    accent === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/5"
      : accent === "amber"
        ? "border-amber-500/20 bg-amber-500/5"
        : accent === "blue"
          ? "border-blue-500/20 bg-blue-500/5"
          : "border-white/10 bg-white/5";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${accentClass}`}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
