"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { memo, useMemo, useState, useTransition } from "react";
import {
  archiveHorseListing,
  deleteHorseListing,
  duplicateHorseListing,
  markHorseListingSold,
  publishHorseListing,
  restoreHorseListing,
  unpublishHorseListing,
} from "@/app/actions/horse-listings";
import ListingPreview from "@/app/components/sell/ListingPreview";
import FadeUp from "@/app/components/animations/FadeUp";
import SellerDashboardAnalytics from "@/app/components/seller-dashboard/SellerDashboardAnalytics";
import SellerDashboardListingsTable from "@/app/components/seller-dashboard/SellerDashboardListingsTable";
import SellerDashboardMessages from "@/app/components/seller-dashboard/SellerDashboardMessages";
import SellerDashboardMetricCard from "@/app/components/seller-dashboard/SellerDashboardMetricCard";
import SellerDashboardQuickActions from "@/app/components/seller-dashboard/SellerDashboardQuickActions";
import SellerDashboardTasks from "@/app/components/seller-dashboard/SellerDashboardTasks";
import SellerCrmHub from "@/app/components/seller-dashboard/crm/SellerCrmHub";
import VerifiedBadge from "@/app/components/verification/VerifiedBadge";
import { getGreetingPrefix, useDashboardRelativeTime } from "@/app/components/seller-dashboard/dashboard-i18n";
import {
  buildAnalyticsSeries,
  buildOverviewMetrics,
  buildSellerTasks,
  computeProfileScore,
  countUnreadConversations,
} from "@/app/components/seller-dashboard/seller-dashboard-utils";
import type { ConversationPreview } from "@/app/types/messaging";
import { listingRowToFormData, listingImagesFromRow } from "@/app/lib/horse-listings";
import type { ListingActionKey } from "@/app/lib/marketplace/listing-actions-config";
import { resolveListingActionError } from "@/app/lib/marketplace/listing-action-errors";
import { getPublicListingPath, getListingEditPath, MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { SellerDashboardListingMetrics } from "@/app/types/marketplace-public";

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
    conversations: ConversationPreview[];
    recentConversations: ConversationPreview[];
    crm: import("@/app/components/seller-dashboard/crm/seller-crm-types").SellerCrmData;
  };
  sellerName: string;
  sellerVerified?: boolean;
  crmEnabled?: boolean;
};

function SellerDashboardClient({
  dashboard,
  sellerName,
  sellerVerified = false,
  crmEnabled = true,
}: Props) {
  const t = useTranslations("dashboard");
  const tMarketplace = useTranslations("marketplace");
  const router = useRouter();
  const [activeView, setActiveView] = useState<"overview" | "crm">(crmEnabled ? "crm" : "overview");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatTime = useDashboardRelativeTime();

  const profileScore = useMemo(
    () => computeProfileScore(dashboard.listings),
    [dashboard.listings]
  );
  const unreadMessages = useMemo(
    () => countUnreadConversations(dashboard.conversations),
    [dashboard.conversations]
  );
  const overviewMetrics = useMemo(
    () => buildOverviewMetrics(dashboard.stats, profileScore, unreadMessages),
    [dashboard.stats, profileScore, unreadMessages]
  );
  const analyticsSeries = useMemo(
    () =>
      buildAnalyticsSeries(
        dashboard.listings,
        dashboard.metricsByListingId,
        dashboard.conversations
      ),
    [dashboard.listings, dashboard.metricsByListingId, dashboard.conversations]
  );
  const tasks = useMemo(() => buildSellerTasks(dashboard.listings), [dashboard.listings]);

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
      const message = resolveListingActionError(result, tMarketplace);
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

  return (
    <div className="space-y-8 lg:space-y-10">
      <FadeUp immediate>
        <header className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-[#132038] via-[#0d1628] to-[#081223] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_45%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-400">
                {t("header.eyebrow")}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                {getGreetingPrefix(t)}, {sellerName}
              </h1>
              {sellerVerified ? (
                <div className="mt-3">
                  <VerifiedBadge label="seller" />
                </div>
              ) : null}
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
                {activeView === "crm" ? t("header.crmSubtitle") : t("header.subtitle")}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-xl border border-white/10 bg-[#08111F]/80 p-1">
                {(
                  [
                    ...(crmEnabled ? [{ key: "crm" as const, label: t("header.tabs.crm") }] : []),
                    { key: "overview", label: t("header.tabs.overview") },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveView(tab.key)}
                    className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      activeView === tab.key
                        ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Link
              href={MARKETPLACE_PATHS.createListing}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              {t("header.createListing")}
            </Link>
            </div>
          </div>
        </header>
      </FadeUp>

      <FadeUp>
        <section aria-label={t("header.overviewMetricsAria")}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
            {overviewMetrics.map((metric) => (
              <SellerDashboardMetricCard key={metric.key} metric={metric} />
            ))}
          </div>
        </section>
      </FadeUp>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {activeView === "crm" ? (
        <SellerCrmHub crm={dashboard.crm} />
      ) : (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-10">
          <div className="min-w-0 space-y-8">
            <FadeUp>
              <SellerDashboardAnalytics series={analyticsSeries} />
            </FadeUp>

            <FadeUp>
              <SellerDashboardListingsTable
                listings={dashboard.listings}
                metricsByListingId={dashboard.metricsByListingId}
                pendingId={pendingId}
                isPending={isPending}
                onAction={handleListingAction}
              />
            </FadeUp>

            <FadeUp>
              <SellerDashboardMessages
                conversations={dashboard.recentConversations}
                formatTime={formatTime}
              />
            </FadeUp>
          </div>

          <aside className="min-w-0 space-y-8">
            <FadeUp>
              <SellerDashboardTasks
                tasks={tasks}
                hasListings={dashboard.listings.length > 0}
              />
            </FadeUp>
            <FadeUp>
              <SellerDashboardQuickActions />
            </FadeUp>
          </aside>
        </div>
      )}
    </div>
  );
}

export default memo(SellerDashboardClient);

export function ListingPreviewActions({
  listing,
}: {
  listing: HorseListingRow;
}) {
  const t = useTranslations("dashboard");
  const tMarketplace = useTranslations("marketplace");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formData = listingRowToFormData(listing);
  const images = listingImagesFromRow(listing);

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishHorseListing(listing.id);
      const message = resolveListingActionError(result, tMarketplace);
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

      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Link
          href={getListingEditPath(listing.id)}
          className="rounded-xl border border-white/20 px-8 py-4 text-center font-semibold text-white transition hover:bg-white/10"
        >
          {t("preview.backToEdit")}
        </Link>
        {listing.status !== "active" ? (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="rounded-xl bg-emerald-600 px-8 py-4 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {isPending ? t("preview.publishing") : t("preview.publish")}
          </button>
        ) : (
          <Link
            href={getPublicListingPath(listing.slug)}
            className="rounded-xl bg-blue-600 px-8 py-4 text-center font-semibold text-white transition hover:bg-blue-500"
          >
            {t("preview.viewPublic")}
          </Link>
        )}
      </div>
    </div>
  );
}
