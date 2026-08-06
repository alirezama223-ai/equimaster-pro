import { formatListingRowPrice } from "@/app/lib/horse-listings";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { SellerInquiry } from "@/app/types/inquiry";
import type { SellerDashboardListingMetrics } from "@/app/types/marketplace-public";
import type {
  CrmAiRecommendation,
  CrmBuyer,
  CrmNotification,
  CrmPerformanceSnapshot,
  CrmVisit,
  PipelineDeal,
  PipelinePriority,
  PipelineStage,
  SellerCrmData,
} from "@/app/components/seller-dashboard/crm/seller-crm-types";

function inquiryToStage(inquiry: SellerInquiry): PipelineStage {
  if (inquiry.status === "replied") return "negotiating";
  if (inquiry.status === "read") return "contacted";
  if (inquiry.status === "archived") return "sold";
  return "new-inquiry";
}

function inquiryToPriority(inquiry: SellerInquiry): PipelinePriority {
  if (inquiry.status === "new") return "high";
  if (inquiry.message.length > 120) return "medium";
  return "low";
}

function buildPipelineFromInquiries(
  inquiries: SellerInquiry[],
  listings: HorseListingRow[],
  priceOnRequestLabel: string
): PipelineDeal[] {
  return inquiries.map((inquiry) => {
    const listing =
      listings.find((row) => row.id === inquiry.horse_listing_id) ??
      listings.find((row) => row.name === inquiry.horse_name);
    const priceLabel = listing
      ? formatListingRowPrice(listing, priceOnRequestLabel)
      : priceOnRequestLabel;

    return {
      id: `inquiry-${inquiry.id}`,
      buyerName: inquiry.buyer_name,
      horseName: inquiry.horse_name,
      priceLabel,
      dateAt: inquiry.created_at,
      priority: inquiryToPriority(inquiry),
      stage: inquiryToStage(inquiry),
    };
  });
}

function deriveBuyerStatus(inquiriesForBuyer: SellerInquiry[]): CrmBuyer["status"] {
  const sorted = [...inquiriesForBuyer].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latest = sorted[0];

  if (inquiriesForBuyer.length >= 3) return "vip";
  if (inquiriesForBuyer.length >= 2) return "returning";
  if (latest?.status === "new") return "new";

  const createdAt = latest ? new Date(latest.created_at).getTime() : 0;
  const isRecent = Date.now() - createdAt < 7 * 86_400_000;
  if (isRecent) return "hot";

  return "returning";
}

function buildBuyersFromInquiries(inquiries: SellerInquiry[]): CrmBuyer[] {
  const buyerMap = new Map<string, SellerInquiry[]>();

  for (const inquiry of inquiries) {
    const key = inquiry.buyer_email.toLowerCase();
    const existing = buyerMap.get(key) ?? [];
    existing.push(inquiry);
    buyerMap.set(key, existing);
  }

  return Array.from(buyerMap.entries()).map(([email, buyerInquiries]) => {
    const sorted = [...buyerInquiries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latest = sorted[0];

    return {
      id: `buyer-${latest.id}`,
      name: latest.buyer_name,
      email,
      interestedHorse: latest.horse_name,
      lastContactAt: latest.created_at,
      status: deriveBuyerStatus(buyerInquiries),
    };
  });
}

function buildNotifications(inquiries: SellerInquiry[]): CrmNotification[] {
  return inquiries.slice(0, 10).map((inquiry) => ({
    id: `notif-inquiry-${inquiry.id}`,
    type: "inquiry" as const,
    titleKey: "crm.notifications.types.inquiry.title",
    descriptionKey: "crm.notifications.types.inquiry.description",
    descriptionValues: {
      buyer: inquiry.buyer_name,
      horse: inquiry.horse_name,
    },
    timeAt: inquiry.created_at,
    unread: inquiry.status === "new",
  }));
}

function computeAverageResponseMs(inquiries: SellerInquiry[]): number | null {
  const durations: number[] = [];

  for (const inquiry of inquiries) {
    const inquiryCreatedAt = new Date(inquiry.created_at).getTime();
    if (Number.isNaN(inquiryCreatedAt)) continue;

    const sellerReplies = inquiry.messages
      .filter((message) => message.sender_id === inquiry.seller_id)
      .sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    const firstReply = sellerReplies[0];
    if (!firstReply) continue;

    const replyAt = new Date(firstReply.created_at).getTime();
    if (Number.isNaN(replyAt) || replyAt <= inquiryCreatedAt) continue;

    durations.push(replyAt - inquiryCreatedAt);
  }

  if (durations.length === 0) return null;

  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

function buildPerformance(
  listings: HorseListingRow[],
  metricsByListingId: Record<string, SellerDashboardListingMetrics>,
  inquiries: SellerInquiry[],
  stats: { sold: number; active: number }
): CrmPerformanceSnapshot {
  const listingMetrics = listings.map((listing) => ({
    name: listing.name,
    views: metricsByListingId[listing.id]?.viewCount ?? listing.view_count ?? 0,
    favorites: metricsByListingId[listing.id]?.favoriteCount ?? 0,
    score:
      (metricsByListingId[listing.id]?.viewCount ?? listing.view_count ?? 0) +
      (metricsByListingId[listing.id]?.favoriteCount ?? 0) * 2,
  }));

  const rankedByScore = [...listingMetrics]
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  const mostViewed = [...listingMetrics]
    .filter((entry) => entry.views > 0)
    .sort((a, b) => b.views - a.views)[0];
  const mostSaved = [...listingMetrics]
    .filter((entry) => entry.favorites > 0)
    .sort((a, b) => b.favorites - a.favorites)[0];

  const top = rankedByScore[0];
  const averageResponseMs = computeAverageResponseMs(inquiries);
  const hasSalesData = stats.active + stats.sold > 0;
  const conversionRate = hasSalesData
    ? Math.round((stats.sold / Math.max(stats.active + stats.sold, 1)) * 100)
    : null;

  return {
    hasListingData: listings.length > 0,
    bestPerformingHorse: top?.name ?? null,
    mostViewedHorse: mostViewed?.name ?? null,
    mostViewedCount: mostViewed?.views ?? 0,
    highestSavedHorse: mostSaved?.name ?? null,
    highestSavedCount: mostSaved?.favorites ?? 0,
    averageResponseMs,
    averageResponseFallbackKey:
      inquiries.length === 0
        ? "crm.performance.fallbacks.noInquiries"
        : averageResponseMs === null
          ? "crm.performance.fallbacks.noResponseData"
          : undefined,
    conversionRate,
    conversionFallbackKey: hasSalesData ? undefined : "crm.performance.fallbacks.noListingsForConversion",
  };
}

function buildAiRecommendations(
  listings: HorseListingRow[],
  inquiries: SellerInquiry[]
): CrmAiRecommendation[] {
  const recommendationIds: string[] = [];
  const hasUnreadInquiries = inquiries.some((inquiry) => inquiry.status === "new");
  const activeListing = listings.find((listing) => listing.status === "active") ?? listings[0];

  if (hasUnreadInquiries) {
    recommendationIds.push("ai-response");
  }

  if (activeListing) {
    if (!activeListing.video_url) recommendationIds.push("ai-video");
    if (!activeListing.public_health_summary) recommendationIds.push("ai-xrays");
    if (activeListing.description.trim().length < 120) recommendationIds.push("ai-description");
  } else if (listings.length === 0) {
    recommendationIds.push("ai-listing");
  }

  return recommendationIds.slice(0, 5).map((id) => ({
    id,
    impact:
      id === "ai-response" || id === "ai-video" || id === "ai-listing" ? "high" : "medium",
  }));
}

type BuildArgs = {
  listings: HorseListingRow[];
  metricsByListingId: Record<string, SellerDashboardListingMetrics>;
  inquiries: SellerInquiry[];
  stats: {
    total: number;
    active: number;
    sold: number;
    totalViews: number;
    totalFavorites: number;
    totalInquiries: number;
  };
  priceOnRequestLabel: string;
};

export function buildSellerCrmData({
  listings,
  metricsByListingId,
  inquiries,
  stats,
  priceOnRequestLabel,
}: BuildArgs): SellerCrmData {
  return {
    pipeline: buildPipelineFromInquiries(inquiries, listings, priceOnRequestLabel),
    buyers: buildBuyersFromInquiries(inquiries),
    visits: [] as CrmVisit[],
    notifications: buildNotifications(inquiries),
    performance: buildPerformance(listings, metricsByListingId, inquiries, stats),
    aiRecommendations: buildAiRecommendations(listings, inquiries),
  };
}

export function formatAverageResponseDuration(
  ms: number,
  t: (key: string, values?: Record<string, number>) => string
): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.max(1, Math.floor((ms % 3_600_000) / 60_000));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return t("crm.performance.fallbacks.averageResponseDays", { count: days });
  }
  if (hours >= 1) {
    return t("crm.performance.fallbacks.averageResponseHours", { count: hours });
  }
  return t("crm.performance.fallbacks.averageResponseMinutes", { count: minutes });
}
