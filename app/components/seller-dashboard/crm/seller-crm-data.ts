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

function deriveBuyerStatus(
  inquiriesForBuyer: SellerInquiry[]
): CrmBuyer["status"] {
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

function buildPerformance(
  listings: HorseListingRow[],
  metricsByListingId: Record<string, SellerDashboardListingMetrics>,
  stats: { sold: number; totalInquiries: number; active: number }
): CrmPerformanceSnapshot {
  const ranked = listings
    .map((listing) => ({
      name: listing.name,
      views: metricsByListingId[listing.id]?.viewCount ?? listing.view_count ?? 0,
      favorites: metricsByListingId[listing.id]?.favoriteCount ?? 0,
    }))
    .sort((a, b) => b.views + b.favorites * 2 - (a.views + a.favorites * 2));

  const top = ranked[0];
  const mostViewed = [...ranked].sort((a, b) => b.views - a.views)[0];
  const mostSaved = [...ranked].sort((a, b) => b.favorites - a.favorites)[0];

  const conversionRate =
    stats.active > 0 ? Math.round((stats.sold / Math.max(stats.active + stats.sold, 1)) * 100) : 0;

  return {
    bestPerformingHorse: top?.name ?? "",
    bestPerformingFallbackKey: top ? undefined : "crm.performance.fallbacks.bestPerforming",
    mostViewedHorse: mostViewed?.name ?? "",
    mostViewedFallbackKey: mostViewed ? undefined : "crm.performance.fallbacks.noViews",
    mostViewedCount: mostViewed?.views ?? 0,
    highestSavedHorse: mostSaved?.name ?? "",
    highestSavedFallbackKey: mostSaved ? undefined : "crm.performance.fallbacks.noFavorites",
    highestSavedCount: mostSaved?.favorites ?? 0,
    averageResponseKey:
      stats.totalInquiries > 0
        ? "crm.performance.fallbacks.averageResponse"
        : "crm.performance.fallbacks.noInquiries",
    conversionKey:
      stats.active + stats.sold > 0
        ? "crm.performance.fallbacks.conversionRate"
        : "crm.performance.fallbacks.zeroConversion",
    conversionValues:
      stats.active + stats.sold > 0 ? { rate: conversionRate } : undefined,
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
    if (activeListing.price && !activeListing.price_on_request) recommendationIds.push("ai-price");
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
    performance: buildPerformance(listings, metricsByListingId, stats),
    aiRecommendations: buildAiRecommendations(listings, inquiries),
  };
}
