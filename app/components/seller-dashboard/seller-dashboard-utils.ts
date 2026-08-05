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

export function getGreetingPrefix(hour = new Date().getHours()): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function buildOverviewMetrics(
  stats: SellerDashboardStats,
  profileScore: number,
  unreadMessages: number
): SellerMetricCard[] {
  const cards: SellerMetricCard[] = [
    {
      key: "active",
      label: "Active Listings",
      value: stats.active,
      trend: stats.draft > 0 ? `${stats.draft} drafts in progress` : "All listings live",
      accent: "blue",
    },
    {
      key: "sold",
      label: "Sold Horses",
      value: stats.sold,
      trend: stats.sold > 0 ? "Completed sales" : "No sales recorded yet",
      accent: "emerald",
    },
    {
      key: "favorites",
      label: "Favorites",
      value: stats.totalFavorites,
      trend: stats.totalFavorites > 0 ? "Buyers saved your horses" : "Waiting for first favorite",
      accent: "violet",
    },
    {
      key: "messages",
      label: "Messages",
      value: stats.totalInquiries,
      trend:
        unreadMessages > 0
          ? `${unreadMessages} unread conversation${unreadMessages === 1 ? "" : "s"}`
          : "Inbox up to date",
      accent: "rose",
    },
    {
      key: "views",
      label: "Views (30 days)",
      value: stats.totalViews,
      trend: stats.totalViews > 0 ? "Lifetime listing views" : "Publish to start tracking",
      accent: "amber",
    },
    {
      key: "profile",
      label: "Profile Score",
      value: `${profileScore}%`,
      trend: profileScore >= 80 ? "Strong seller presence" : "Complete tasks to improve",
      accent: "blue",
    },
  ];

  return cards;
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
    { key: "profile", label: "Complete profile", completed: hasProfileDetails },
    { key: "verify", label: "Verify identity", completed: hasVerified },
    { key: "passport", label: "Upload passport", completed: hasPassportData },
    { key: "xrays", label: "Upload x-rays", completed: hasHealthDocs },
    { key: "pedigree", label: "Add pedigree", completed: hasPedigree },
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
  inquiries: SellerInquiry[]
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
      label: "Views",
      color: "#3b82f6",
      points: viewsByListing.length > 0 ? viewsByListing : [{ label: "No views yet", value: 0 }],
      total: listings.reduce((sum, listing) => sum + (listing.view_count ?? 0), 0),
    },
    {
      key: "favorites",
      label: "Favorites",
      color: "#8b5cf6",
      points:
        favoritesByListing.length > 0
          ? favoritesByListing
          : [{ label: "No favorites yet", value: 0 }],
      total: Object.values(metricsByListingId).reduce((sum, metric) => sum + metric.favoriteCount, 0),
    },
    {
      key: "contacts",
      label: "Contacts",
      color: "#10b981",
      points:
        contactsByListing.length > 0
          ? contactsByListing
          : [{ label: "No contacts yet", value: 0 }],
      total: Object.values(metricsByListingId).reduce((sum, metric) => sum + metric.inquiryCount, 0),
    },
    {
      key: "inquiries",
      label: "Inquiries",
      color: "#f59e0b",
      points: inquiryDaily.slice(-14),
      total: inquiryTotal > 0 ? inquiryTotal : inquiries.length,
    },
  ];
}

export function countUnreadInquiries(inquiries: SellerInquiry[]): number {
  return inquiries.filter((inquiry) => inquiry.status === "new").length;
}

export function formatRelativeTime(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

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
