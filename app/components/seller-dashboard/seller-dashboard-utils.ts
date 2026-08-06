import type { HorseListingRow } from "@/app/types/horse-listing";
import type { ConversationPreview } from "@/app/types/messaging";
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
  labelKey: string;
  value: number | string;
  trendKey?: string;
  trendValues?: Record<string, string | number>;
  accent?: "blue" | "emerald" | "violet" | "amber" | "rose";
};

export type SellerChartPoint = {
  label?: string;
  dateKey?: string;
  value: number;
  isEmptyPlaceholder?: boolean;
};

export type SellerChartSeries = {
  key: string;
  labelKey: string;
  emptyKey?: string;
  color: string;
  points: SellerChartPoint[];
  total: number;
  isTimeline?: boolean;
};

export type SellerTaskItem = {
  key: "profile" | "verify" | "passport" | "xrays" | "pedigree";
  completed: boolean;
};

const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatShortDay(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export function formatAnalyticsTimelineLabel(dateKey: string, locale?: string): string {
  return formatShortDay(new Date(dateKey), locale);
}

export function buildOverviewMetrics(
  stats: SellerDashboardStats,
  profileScore: number,
  unreadMessages: number
): SellerMetricCard[] {
  return [
    {
      key: "active",
      labelKey: "metrics.activeListings",
      value: stats.active,
      trendKey:
        stats.draft > 0 ? "metrics.draftsInProgress" : "metrics.allListingsLive",
      trendValues: stats.draft > 0 ? { count: stats.draft } : undefined,
      accent: "blue",
    },
    {
      key: "sold",
      labelKey: "metrics.soldHorses",
      value: stats.sold,
      trendKey: stats.sold > 0 ? "metrics.completedSales" : "metrics.noSalesRecorded",
      accent: "emerald",
    },
    {
      key: "favorites",
      labelKey: "metrics.favorites",
      value: stats.totalFavorites,
      trendKey:
        stats.totalFavorites > 0 ? "metrics.buyersSaved" : "metrics.waitingForFavorite",
      accent: "violet",
    },
    {
      key: "messages",
      labelKey: "metrics.messages",
      value: stats.totalInquiries,
      trendKey:
        unreadMessages > 0 ? "metrics.unreadConversations" : "metrics.inboxUpToDate",
      trendValues: unreadMessages > 0 ? { count: unreadMessages } : undefined,
      accent: "rose",
    },
    {
      key: "views",
      labelKey: "metrics.views30Days",
      value: stats.totalViews,
      trendKey: stats.totalViews > 0 ? "metrics.lifetimeViews" : "metrics.publishToTrack",
      accent: "amber",
    },
    {
      key: "profile",
      labelKey: "metrics.profileScore",
      value: `${profileScore}%`,
      trendKey: profileScore >= 80 ? "metrics.strongPresence" : "metrics.completeTasks",
      accent: "blue",
    },
  ];
}

export function computeProfileScore(listings: HorseListingRow[]): number {
  if (listings.length === 0) return 0;

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

export function buildSellerTasks(listings: HorseListingRow[]): SellerTaskItem[] {
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
    { key: "profile", completed: hasProfileDetails },
    { key: "verify", completed: hasVerified },
    { key: "passport", completed: hasPassportData },
    { key: "xrays", completed: hasHealthDocs },
    { key: "pedigree", completed: hasPedigree },
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

function bucketSeriesFromDates(dates: string[], days = 30): SellerChartPoint[] {
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
    dateKey: key,
    value,
  }));
}

function buildListingMetricSeries(
  listings: HorseListingRow[],
  metricsByListingId: Record<string, SellerDashboardListingMetrics>,
  metric: "viewCount" | "favoriteCount" | "inquiryCount"
): SellerChartPoint[] {
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
  conversations: ConversationPreview[]
): SellerChartSeries[] {
  const conversationDates = conversations.map(
    (conversation) => conversation.last_message_at ?? conversation.updated_at
  );
  const inquiryDaily = bucketSeriesFromDates(conversationDates);
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
      labelKey: "analytics.series.views",
      emptyKey: "analytics.empty.noViews",
      color: "#3b82f6",
      points:
        viewsByListing.length > 0
          ? viewsByListing
          : [{ label: "", value: 0, isEmptyPlaceholder: true }],
      total: listings.reduce((sum, listing) => sum + (listing.view_count ?? 0), 0),
    },
    {
      key: "favorites",
      labelKey: "analytics.series.favorites",
      emptyKey: "analytics.empty.noFavorites",
      color: "#8b5cf6",
      points:
        favoritesByListing.length > 0
          ? favoritesByListing
          : [{ label: "", value: 0, isEmptyPlaceholder: true }],
      total: Object.values(metricsByListingId).reduce((sum, metric) => sum + metric.favoriteCount, 0),
    },
    {
      key: "contacts",
      labelKey: "analytics.series.contacts",
      emptyKey: "analytics.empty.noContacts",
      color: "#10b981",
      points:
        contactsByListing.length > 0
          ? contactsByListing
          : [{ label: "", value: 0, isEmptyPlaceholder: true }],
      total: Object.values(metricsByListingId).reduce((sum, metric) => sum + metric.inquiryCount, 0),
    },
    {
      key: "inquiries",
      labelKey: "analytics.series.inquiries",
      emptyKey: "analytics.empty.noInquiries",
      color: "#f59e0b",
      points:
        inquiryTotal > 0
          ? inquiryDaily.slice(-14)
          : [{ value: 0, isEmptyPlaceholder: true }],
      total: inquiryTotal,
      isTimeline: true,
    },
  ];
}

export function countUnreadConversations(conversations: ConversationPreview[]): number {
  return conversations.reduce((sum, conversation) => sum + conversation.unread_count, 0);
}

export function getBuyerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
