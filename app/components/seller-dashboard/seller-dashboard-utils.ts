import type { DashboardTranslator } from "@/app/components/seller-dashboard/dashboard-i18n";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { SellerInquiry } from "@/app/types/inquiry";
import type { SellerDashboardListingMetrics } from "@/app/types/marketplace-public";

export type SellerDashboardStats = {
  total: number;
  active: number;
  draft: number;
  sold: number;
  archived: number;
  totalViews: number;
  totalFavorites: number;
  totalInquiries: number;
};

export type SellerMetricCard = {
  key: string;
  label: string;
  value: number | string;
  trend?: string;
  accent?: "blue" | "emerald" | "violet" | "amber" | "rose";
};

export type SellerChartSeries = {
  key: string;
  label: string;
  color: string;
  points: { label: string; value: number }[];
  total: number;
  isTimeline?: boolean;
};

export type SellerTaskItem = {
  key: string;
  label: string;
  completed: boolean;
};

const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatShortDay(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getGreetingPrefix(t: DashboardTranslator, hour = new Date().getHours()): string {
  if (hour < 12) return t("greeting.morning");
  if (hour < 17) return t("greeting.afternoon");
  return t("greeting.evening");
}

export function buildOverviewMetrics(
  stats: SellerDashboardStats,
  profileScore: number,
  unreadMessages: number,
  t: DashboardTranslator
): SellerMetricCard[] {
  return [
    {
      key: "active",
      label: t("metrics.activeListings"),
      value: stats.active,
      trend:
        stats.draft > 0
          ? t("metrics.draftsInProgress", { count: stats.draft })
          : t("metrics.allListingsLive"),
      accent: "blue",
    },
    {
      key: "sold",
      label: t("metrics.soldHorses"),
      value: stats.sold,
      trend: stats.sold > 0 ? t("metrics.completedSales") : t("metrics.noSalesRecorded"),
      accent: "emerald",
    },
    {
      key: "favorites",
      label: t("metrics.favorites"),
      value: stats.totalFavorites,
      trend:
        stats.totalFavorites > 0
          ? t("metrics.buyersSaved")
          : t("metrics.waitingForFavorite"),
      accent: "violet",
    },
    {
      key: "messages",
      label: t("metrics.messages"),
      value: stats.totalInquiries,
      trend:
        unreadMessages > 0
          ? t("metrics.unreadConversations", { count: unreadMessages })
          : t("metrics.inboxUpToDate"),
      accent: "rose",
    },
    {
      key: "views",
      label: t("metrics.views30Days"),
      value: stats.totalViews,
      trend: stats.totalViews > 0 ? t("metrics.lifetimeViews") : t("metrics.publishToTrack"),
      accent: "amber",
    },
    {
      key: "profile",
      label: t("metrics.profileScore"),
      value: `${profileScore}%`,
      trend: profileScore >= 80 ? t("metrics.strongPresence") : t("metrics.completeTasks"),
      accent: "blue",
    },
  ];
}

export function computeProfileScore(listings: HorseListingRow[]): number {
  if (listings.length === 0) return 12;

  let score = 20;

  if (listings.some((listing) => listing.status === "active")) score += 20;
  if (listings.some((listing) => listing.description.trim().length >= 80)) score += 15;
  if (listings.some((listing) => (listing.image_urls?.length ?? 0) > 0)) score += 15;
  if (listings.some((listing) => listing.pedigree_horse_id || (listing.sire && listing.dam))) {
    score += 15;
  }
  if (listings.some((listing) => listing.verified)) score += 10;
  if (
    listings.some(
      (listing) =>
        listing.seller_name.trim() &&
        listing.seller_email.trim() &&
        listing.seller_phone.trim()
    )
  ) {
    score += 5;
  }

  return Math.min(100, score);
}

export function buildSellerTasks(
  listings: HorseListingRow[],
  t: DashboardTranslator
): SellerTaskItem[] {
  const hasProfileDetails = listings.some(
    (listing) =>
      listing.seller_name.trim() &&
      listing.seller_email.trim() &&
      listing.description.trim().length >= 40
  );
  const hasVerified = listings.some((listing) => listing.verified);
  const hasPassportData = listings.some(
    (listing) =>
      Boolean(listing.sire?.trim() && listing.dam?.trim()) ||
      (listing.images_meta ?? []).some((image) => /passport|registration/i.test(image.name))
  );
  const hasHealthDocs = listings.some((listing) => listing.public_health_summary != null);
  const hasPedigree = listings.some(
    (listing) => Boolean(listing.pedigree_horse_id) || Boolean(listing.sire?.trim() && listing.dam?.trim())
  );

  return [
    { key: "profile", label: t("tasks.items.profile"), completed: hasProfileDetails },
    { key: "verify", label: t("tasks.items.verify"), completed: hasVerified },
    { key: "passport", label: t("tasks.items.passport"), completed: hasPassportData },
    { key: "xrays", label: t("tasks.items.xrays"), completed: hasHealthDocs },
    { key: "pedigree", label: t("tasks.items.pedigree"), completed: hasPedigree },
  ];
}

function buildDailyBuckets(days = 30): Map<string, number> {
  const buckets = new Map<string, number>();
  const today = startOfDay(new Date());

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * DAY_MS);
    buckets.set(date.toISOString().slice(0, 10), 0);
  }

  return buckets;
}

function bucketSeriesFromDates(dates: string[], days = 30): { label: string; value: number }[] {
  const buckets = buildDailyBuckets(days);
  const cutoff = startOfDay(new Date()).getTime() - (days - 1) * DAY_MS;

  for (const iso of dates) {
    const timestamp = new Date(iso).getTime();
    if (Number.isNaN(timestamp) || timestamp < cutoff) continue;
    const key = startOfDay(new Date(timestamp)).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([key, value]) => ({
    label: formatShortDay(new Date(key)),
    value,
  }));
}

function buildListingMetricSeries(
  listings: HorseListingRow[],
  metricsByListingId: Record<string, SellerDashboardListingMetrics>,
  metric: "viewCount" | "favoriteCount" | "inquiryCount"
): { label: string; value: number }[] {
  return listings
    .map((listing) => ({
      label: listing.name.length > 18 ? `${listing.name.slice(0, 16)}…` : listing.name,
      value: metricsByListingId[listing.id]?.[metric] ?? 0,
    }))
    .filter((point) => point.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export function buildAnalyticsSeries(
  listings: HorseListingRow[],
  metricsByListingId: Record<string, SellerDashboardListingMetrics>,
  inquiries: SellerInquiry[],
  t: DashboardTranslator
): SellerChartSeries[] {
  const inquiryDates = inquiries.map((inquiry) => inquiry.created_at);
  const inquiryDaily = bucketSeriesFromDates(inquiryDates);
  const inquiryTotal = inquiryDaily.reduce((sum, point) => sum + point.value, 0);

  const viewsByListing = buildListingMetricSeries(listings, metricsByListingId, "viewCount");
  const favoritesByListing = buildListingMetricSeries(
    listings,
    metricsByListingId,
    "favoriteCount"
  );
  const contactsByListing = buildListingMetricSeries(
    listings,
    metricsByListingId,
    "inquiryCount"
  );

  return [
    {
      key: "views",
      label: t("analytics.series.views"),
      color: "#3b82f6",
      points:
        viewsByListing.length > 0
          ? viewsByListing
          : [{ label: t("analytics.empty.noViews"), value: 0 }],
      total: listings.reduce((sum, listing) => sum + (listing.view_count ?? 0), 0),
    },
    {
      key: "favorites",
      label: t("analytics.series.favorites"),
      color: "#8b5cf6",
      points:
        favoritesByListing.length > 0
          ? favoritesByListing
          : [{ label: t("analytics.empty.noFavorites"), value: 0 }],
      total: Object.values(metricsByListingId).reduce((sum, metric) => sum + metric.favoriteCount, 0),
    },
    {
      key: "contacts",
      label: t("analytics.series.contacts"),
      color: "#10b981",
      points:
        contactsByListing.length > 0
          ? contactsByListing
          : [{ label: t("analytics.empty.noContacts"), value: 0 }],
      total: Object.values(metricsByListingId).reduce((sum, metric) => sum + metric.inquiryCount, 0),
    },
    {
      key: "inquiries",
      label: t("analytics.series.inquiries"),
      color: "#f59e0b",
      points: inquiryDaily.slice(-14),
      total: inquiryTotal > 0 ? inquiryTotal : inquiries.length,
      isTimeline: true,
    },
  ];
}

export function countUnreadInquiries(inquiries: SellerInquiry[]): number {
  return inquiries.filter((inquiry) => inquiry.status === "new").length;
}

export function formatRelativeTime(iso: string, t: DashboardTranslator): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return t("relativeTime.justNow");
  if (minutes < 60) return t("relativeTime.minutesAgo", { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("relativeTime.hoursAgo", { count: hours });

  const days = Math.floor(hours / 24);
  if (days === 1) return t("relativeTime.yesterday");
  if (days < 7) return t("relativeTime.daysAgo", { count: days });

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getBuyerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
