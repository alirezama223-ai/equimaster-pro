import type { DashboardTranslator } from "@/app/components/seller-dashboard/dashboard-i18n";
import { formatRelativeTime, getBuyerInitials } from "@/app/components/seller-dashboard/seller-dashboard-utils";
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

function buildMockBuyers(t: DashboardTranslator): Omit<CrmBuyer, "id">[] {
  return [0, 1, 2, 3].map((index) => ({
    name: t(`crm.demo.mockBuyers.${index}.name`),
    email: `buyer-${index}@example.com`,
    interestedHorse: t(`crm.demo.mockBuyers.${index}.horse`),
    lastContactLabel: t(`crm.demo.mockBuyers.${index}.lastContact`),
    status: (["hot", "vip", "returning", "new"] as const)[index],
  }));
}

function buildMockPipeline(t: DashboardTranslator): Omit<PipelineDeal, "id">[] {
  const stages: PipelineStage[] = [
    "new-inquiry",
    "contacted",
    "visit-scheduled",
    "negotiating",
    "sold",
  ];
  const priorities: PipelinePriority[] = ["high", "high", "medium", "medium", "low"];

  return [0, 1, 2, 3, 4].map((index) => ({
    buyerName: t(`crm.demo.mockPipeline.${index}.buyer`),
    horseName: t(`crm.demo.mockPipeline.${index}.horse`),
    priceLabel: t(`crm.demo.mockPipeline.${index}.price`),
    dateLabel: t(`crm.demo.mockPipeline.${index}.date`),
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
  priceOnRequestLabel: string,
  t: DashboardTranslator
): PipelineDeal[] {
  const fromInquiries = inquiries.map((inquiry, index) => {
    const listing = listings.find((row) => row.name === inquiry.horse_name);
    const priceLabel = listing
      ? formatListingRowPrice(listing, priceOnRequestLabel)
      : priceOnRequestLabel;

    return {
      id: `inquiry-${inquiry.id}`,
      buyerName: inquiry.buyer_name,
      horseName: inquiry.horse_name,
      priceLabel,
      dateLabel: formatRelativeTime(inquiry.created_at, t) || t("relativeTime.recent"),
      priority: inquiryToPriority(inquiry),
      stage: inquiryToStage(inquiry, index),
    };
  });

  if (fromInquiries.length >= 4) {
    return fromInquiries;
  }

  const mockDeals = buildMockPipeline(t).map((deal, index) => ({
    ...deal,
    id: `mock-pipeline-${index}`,
  }));

  const merged = [...fromInquiries];
  for (const deal of mockDeals) {
    if (merged.length >= 6) break;
    if (!merged.some((item) => item.buyerName === deal.buyerName && item.horseName === deal.horseName)) {
      merged.push(deal);
    }
  }

  return merged;
}

function buildBuyersFromInquiries(inquiries: SellerInquiry[], t: DashboardTranslator): CrmBuyer[] {
  const buyerMap = new Map<string, CrmBuyer>();

  inquiries.forEach((inquiry, index) => {
    const key = inquiry.buyer_email.toLowerCase();
    if (buyerMap.has(key)) return;

    buyerMap.set(key, {
      id: `buyer-${inquiry.id}`,
      name: inquiry.buyer_name,
      email: inquiry.buyer_email,
      interestedHorse: inquiry.horse_name,
      lastContactLabel: formatRelativeTime(inquiry.created_at, t) || t("relativeTime.recent"),
      status: inquiry.status === "new" ? "new" : index % 3 === 0 ? "returning" : "hot",
    });
  });

  const buyers = Array.from(buyerMap.values());

  if (buyers.length >= 4) {
    return buyers;
  }

  buildMockBuyers(t).forEach((buyer, index) => {
    if (buyers.some((item) => item.email === buyer.email)) return;
    buyers.push({ ...buyer, id: `mock-buyer-${index}` });
  });

  return buyers;
}

function buildVisits(
  listings: HorseListingRow[],
  buyers: CrmBuyer[],
  t: DashboardTranslator
): CrmVisit[] {
  const today = new Date();
  const horseNames =
    listings.length > 0
      ? listings.slice(0, 3).map((listing) => listing.name)
      : [0, 1, 2].map((index) => t(`crm.demo.mockHorses.${index}`));

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
      dateLabel: date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      timeLabel: template.time,
      horseName: horseNames[index % horseNames.length] ?? t("crm.demo.featuredHorse"),
      buyerName: buyer?.name ?? t("crm.demo.privateBuyer"),
      location: t(`crm.demo.visitLocations.${template.locationKey}`),
      isToday: template.dayOffset === 0,
    };
  });
}

function buildNotifications(
  inquiries: SellerInquiry[],
  stats: { totalFavorites: number; totalViews: number },
  t: DashboardTranslator
): CrmNotification[] {
  const notifications: CrmNotification[] = inquiries.slice(0, 3).map((inquiry, index) => ({
    id: `notif-inquiry-${inquiry.id}`,
    type: "inquiry" as const,
    title: t("crm.notifications.types.inquiry.title"),
    description: t("crm.notifications.types.inquiry.description", {
      buyer: inquiry.buyer_name,
      horse: inquiry.horse_name,
    }),
    timeLabel: formatRelativeTime(inquiry.created_at, t) || t("relativeTime.recent"),
    unread: inquiry.status === "new" || index === 0,
  }));

  const mockNotifications: CrmNotification[] = [
    {
      id: "notif-favorite",
      type: "favorite",
      title: t("crm.notifications.types.favorite.title"),
      description:
        stats.totalFavorites > 0
          ? t("crm.notifications.types.favorite.descriptionWithCount", {
              count: stats.totalFavorites,
            })
          : t("crm.notifications.types.favorite.description"),
      timeLabel: t("relativeTime.hoursAgoLong", { count: 4 }),
      unread: true,
    },
    {
      id: "notif-profile",
      type: "profile-view",
      title: t("crm.notifications.types.profile-view.title"),
      description: t("crm.notifications.types.profile-view.description"),
      timeLabel: t("relativeTime.hoursAgoLong", { count: 6 }),
      unread: stats.totalViews > 0,
    },
    {
      id: "notif-visit",
      type: "visit-request",
      title: t("crm.notifications.types.visit-request.title"),
      description: t("crm.notifications.types.visit-request.description"),
      timeLabel: t("relativeTime.yesterday"),
      unread: false,
    },
    {
      id: "notif-offer",
      type: "offer",
      title: t("crm.notifications.types.offer.title"),
      description: t("crm.notifications.types.offer.description"),
      timeLabel: t("relativeTime.daysAgo", { count: 2 }),
      unread: false,
    },
  ];

  return [...notifications, ...mockNotifications].slice(0, 6);
}

function buildPerformance(
  listings: HorseListingRow[],
  metricsByListingId: Record<string, SellerDashboardListingMetrics>,
  stats: { sold: number; totalInquiries: number; active: number },
  t: DashboardTranslator
): CrmPerformanceSnapshot {
  const ranked = listings
    .map((listing) => ({
      name: listing.name,
      views: metricsByListingId[listing.id]?.viewCount ?? listing.view_count ?? 0,
      favorites: metricsByListingId[listing.id]?.favoriteCount ?? 0,
      inquiries: metricsByListingId[listing.id]?.inquiryCount ?? 0,
    }))
    .sort((a, b) => b.views + b.favorites * 2 - (a.views + a.favorites * 2));

  const top = ranked[0];
  const mostViewed = [...ranked].sort((a, b) => b.views - a.views)[0];
  const mostSaved = [...ranked].sort((a, b) => b.favorites - a.favorites)[0];

  const conversionRate =
    stats.active > 0 ? Math.round((stats.sold / Math.max(stats.active + stats.sold, 1)) * 100) : 0;

  return {
    bestPerformingHorse: top?.name ?? t("crm.performance.fallbacks.bestPerforming"),
    mostViewedHorse: mostViewed?.name ?? t("crm.performance.fallbacks.noViews"),
    mostViewedCount: mostViewed?.views ?? 0,
    highestSavedHorse: mostSaved?.name ?? t("crm.performance.fallbacks.noFavorites"),
    highestSavedCount: mostSaved?.favorites ?? 0,
    averageResponseLabel:
      stats.totalInquiries > 0
        ? t("crm.performance.fallbacks.averageResponse")
        : t("crm.performance.fallbacks.noInquiries"),
    conversionLabel:
      stats.active + stats.sold > 0
        ? t("crm.performance.fallbacks.conversionRate", { rate: conversionRate })
        : t("crm.performance.fallbacks.zeroConversion"),
  };
}

function buildAiRecommendations(
  listings: HorseListingRow[],
  t: DashboardTranslator
): CrmAiRecommendation[] {
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
    label: t(`crm.ai.recommendations.${id}`),
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
  t: DashboardTranslator;
};

export function buildSellerCrmData({
  listings,
  metricsByListingId,
  recentInquiries,
  stats,
  priceOnRequestLabel,
  t,
}: BuildArgs): SellerCrmData {
  const buyers = buildBuyersFromInquiries(recentInquiries, t);

  return {
    pipeline: buildPipelineFromInquiries(recentInquiries, listings, priceOnRequestLabel, t),
    buyers,
    visits: buildVisits(listings, buyers, t),
    notifications: buildNotifications(recentInquiries, stats, t),
    performance: buildPerformance(listings, metricsByListingId, stats, t),
    aiRecommendations: buildAiRecommendations(listings, t),
  };
}

export { getBuyerInitials };
