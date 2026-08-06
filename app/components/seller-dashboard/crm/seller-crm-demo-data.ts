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

function buildMockBuyers(): Omit<CrmBuyer, "id">[] {
  const now = Date.now();
  const contactOffsets = [2 * 3_600_000, 26 * 3_600_000, 3 * 86_400_000, 45_000];

  return [0, 1, 2, 3].map((index) => ({
    name: "",
    email: `buyer-${index}@example.com`,
    interestedHorse: "",
    demoIndex: index,
    lastContactAt: new Date(now - contactOffsets[index]).toISOString(),
    status: (["hot", "vip", "returning", "new"] as const)[index],
  }));
}

function buildMockPipeline(): Omit<PipelineDeal, "id">[] {
  const stages: PipelineStage[] = [
    "new-inquiry",
    "contacted",
    "visit-scheduled",
    "negotiating",
    "sold",
  ];
  const priorities: PipelinePriority[] = ["high", "high", "medium", "medium", "low"];

  return [0, 1, 2, 3, 4].map((index) => ({
    buyerName: "",
    horseName: "",
    priceLabel: "",
    demoIndex: index,
    dateKey: `crm.demo.mockPipeline.${index}.date`,
    priority: priorities[index],
    stage: stages[index],
  }));
}

function inquiryToStage(inquiry: SellerInquiry, index: number): PipelineStage {
  if (inquiry.status === "replied") return index % 2 === 0 ? "negotiating" : "contacted";
  if (inquiry.status === "read") return "contacted";
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
  const fromInquiries: PipelineDeal[] = inquiries.map((inquiry, index) => {
    const listing = listings.find((row) => row.name === inquiry.horse_name);
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
      stage: inquiryToStage(inquiry, index),
    };
  });

  if (fromInquiries.length >= 4) {
    return fromInquiries;
  }

  const mockDeals: PipelineDeal[] = buildMockPipeline().map((deal, index) => ({
    ...deal,
    id: `mock-pipeline-${index}`,
  }));

  const merged: PipelineDeal[] = [...fromInquiries];
  for (const deal of mockDeals) {
    if (merged.length >= 6) break;
    merged.push(deal);
  }

  return merged;
}

function buildBuyersFromInquiries(inquiries: SellerInquiry[]): CrmBuyer[] {
  const buyerMap = new Map<string, CrmBuyer>();

  inquiries.forEach((inquiry, index) => {
    const key = inquiry.buyer_email.toLowerCase();
    if (buyerMap.has(key)) return;

    buyerMap.set(key, {
      id: `buyer-${inquiry.id}`,
      name: inquiry.buyer_name,
      email: inquiry.buyer_email,
      interestedHorse: inquiry.horse_name,
      lastContactAt: inquiry.created_at,
      status: inquiry.status === "new" ? "new" : index % 3 === 0 ? "returning" : "hot",
    });
  });

  const buyers = Array.from(buyerMap.values());

  if (buyers.length >= 4) {
    return buyers;
  }

  buildMockBuyers().forEach((buyer, index) => {
    if (buyers.some((item) => item.email === buyer.email)) return;
    buyers.push({ ...buyer, id: `mock-buyer-${index}` });
  });

  return buyers;
}

function buildVisits(listings: HorseListingRow[], buyers: CrmBuyer[]): CrmVisit[] {
  const today = new Date();
  const hasListingHorses = listings.length > 0;

  const visitTemplates = [
    { dayOffset: 0, time: "10:30", locationKey: "0" },
    { dayOffset: 0, time: "15:00", locationKey: "1" },
    { dayOffset: 2, time: "11:00", locationKey: "2" },
    { dayOffset: 5, time: "09:30", locationKey: "3" },
  ];

  return visitTemplates.map((template, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + template.dayOffset);
    const buyer = buyers[index % buyers.length];

    return {
      id: `visit-${index}`,
      dateAt: date.toISOString(),
      timeLabel: template.time,
      horseName: hasListingHorses ? listings[index % listings.length]?.name ?? "" : "",
      demoHorseIndex: hasListingHorses ? undefined : index % 3,
      buyerName: buyer?.demoIndex == null ? buyer?.name ?? "" : "",
      demoBuyerIndex: buyer?.demoIndex,
      locationKey: `crm.demo.visitLocations.${template.locationKey}`,
      isToday: template.dayOffset === 0,
    };
  });
}

function buildNotifications(
  inquiries: SellerInquiry[],
  stats: { totalFavorites: number; totalViews: number }
): CrmNotification[] {
  const notifications: CrmNotification[] = inquiries.slice(0, 3).map((inquiry, index) => ({
    id: `notif-inquiry-${inquiry.id}`,
    type: "inquiry" as const,
    titleKey: "crm.notifications.types.inquiry.title",
    descriptionKey: "crm.notifications.types.inquiry.description",
    descriptionValues: {
      buyer: inquiry.buyer_name,
      horse: inquiry.horse_name,
    },
    timeAt: inquiry.created_at,
    unread: inquiry.status === "new" || index === 0,
  }));

  const mockNotifications: CrmNotification[] = [
    {
      id: "notif-favorite",
      type: "favorite",
      titleKey: "crm.notifications.types.favorite.title",
      descriptionKey:
        stats.totalFavorites > 0
          ? "crm.notifications.types.favorite.descriptionWithCount"
          : "crm.notifications.types.favorite.description",
      descriptionValues:
        stats.totalFavorites > 0 ? { count: stats.totalFavorites } : undefined,
      timeKey: "relativeTime.hoursAgoLong",
      timeValues: { count: 4 },
      unread: true,
    },
    {
      id: "notif-profile",
      type: "profile-view",
      titleKey: "crm.notifications.types.profile-view.title",
      descriptionKey: "crm.notifications.types.profile-view.description",
      timeKey: "relativeTime.hoursAgoLong",
      timeValues: { count: 6 },
      unread: stats.totalViews > 0,
    },
    {
      id: "notif-visit",
      type: "visit-request",
      titleKey: "crm.notifications.types.visit-request.title",
      descriptionKey: "crm.notifications.types.visit-request.description",
      timeKey: "relativeTime.yesterday",
      unread: false,
    },
    {
      id: "notif-offer",
      type: "offer",
      titleKey: "crm.notifications.types.offer.title",
      descriptionKey: "crm.notifications.types.offer.description",
      timeKey: "relativeTime.daysAgo",
      timeValues: { count: 2 },
      unread: false,
    },
  ];

  return [...notifications, ...mockNotifications].slice(0, 6);
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

function buildAiRecommendations(listings: HorseListingRow[]): CrmAiRecommendation[] {
  const recommendationIds = ["ai-response"];
  const activeListing = listings.find((listing) => listing.status === "active") ?? listings[0];

  if (activeListing) {
    if (!activeListing.video_url) recommendationIds.push("ai-video");
    if (!activeListing.public_health_summary) recommendationIds.push("ai-xrays");
    if (activeListing.description.trim().length < 120) recommendationIds.push("ai-description");
    if (activeListing.price && !activeListing.price_on_request) recommendationIds.push("ai-price");
  } else {
    recommendationIds.push("ai-listing", "ai-video-mock");
  }

  return recommendationIds.slice(0, 5).map((id) => ({
    id,
    impact: id === "ai-response" || id === "ai-video" || id === "ai-listing" ? "high" : "medium",
  }));
}

type BuildArgs = {
  listings: HorseListingRow[];
  metricsByListingId: Record<string, SellerDashboardListingMetrics>;
  recentInquiries: SellerInquiry[];
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
  recentInquiries,
  stats,
  priceOnRequestLabel,
}: BuildArgs): SellerCrmData {
  const buyers = buildBuyersFromInquiries(recentInquiries);

  return {
    pipeline: buildPipelineFromInquiries(recentInquiries, listings, priceOnRequestLabel),
    buyers,
    visits: buildVisits(listings, buyers),
    notifications: buildNotifications(recentInquiries, stats),
    performance: buildPerformance(listings, metricsByListingId, stats),
    aiRecommendations: buildAiRecommendations(listings),
  };
}

export { getBuyerInitials } from "@/app/components/seller-dashboard/seller-dashboard-utils";
