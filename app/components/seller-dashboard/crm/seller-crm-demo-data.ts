import { formatListingRowPrice } from "@/app/lib/horse-listings";
import { formatRelativeTime, getBuyerInitials } from "@/app/components/seller-dashboard/seller-dashboard-utils";
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

const MOCK_BUYERS: Omit<CrmBuyer, "id">[] = [
  {
    name: "Sophie van der Berg",
    email: "sophie.vanderberg@example.com",
    interestedHorse: "Grand Prix Dream",
    lastContactLabel: "2h ago",
    status: "hot",
  },
  {
    name: "Marcus Lindholm",
    email: "marcus.lindholm@example.com",
    interestedHorse: "Midnight Sovereign",
    lastContactLabel: "Yesterday",
    status: "vip",
  },
  {
    name: "Emma Richardson",
    email: "emma.r@example.com",
    interestedHorse: "Celeste Royale",
    lastContactLabel: "3d ago",
    status: "returning",
  },
  {
    name: "Luca Moretti",
    email: "luca.moretti@example.com",
    interestedHorse: "Atlantic Storm",
    lastContactLabel: "Just now",
    status: "new",
  },
];

const MOCK_PIPELINE: Omit<PipelineDeal, "id">[] = [
  {
    buyerName: "Luca Moretti",
    horseName: "Atlantic Storm",
    priceLabel: "€185,000",
    dateLabel: "Aug 6",
    priority: "high",
    stage: "new-inquiry",
  },
  {
    buyerName: "Sophie van der Berg",
    horseName: "Grand Prix Dream",
    priceLabel: "€240,000",
    dateLabel: "Aug 4",
    priority: "high",
    stage: "contacted",
  },
  {
    buyerName: "Marcus Lindholm",
    horseName: "Midnight Sovereign",
    priceLabel: "€320,000",
    dateLabel: "Aug 2",
    priority: "medium",
    stage: "visit-scheduled",
  },
  {
    buyerName: "Emma Richardson",
    horseName: "Celeste Royale",
    priceLabel: "€98,000",
    dateLabel: "Jul 28",
    priority: "medium",
    stage: "negotiating",
  },
  {
    buyerName: "James Whitfield",
    horseName: "Silver Legacy",
    priceLabel: "€156,000",
    dateLabel: "Jul 20",
    priority: "low",
    stage: "sold",
  },
];

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
  const fromInquiries = inquiries.map((inquiry, index) => {
    const listing = listings.find((row) => row.name === inquiry.horse_name);
    const priceLabel = listing
      ? formatListingRowPrice(listing, priceOnRequestLabel)
      : "Price on request";

    return {
      id: `inquiry-${inquiry.id}`,
      buyerName: inquiry.buyer_name,
      horseName: inquiry.horse_name,
      priceLabel,
      dateLabel: formatRelativeTime(inquiry.created_at) || "Recent",
      priority: inquiryToPriority(inquiry),
      stage: inquiryToStage(inquiry, index),
    };
  });

  if (fromInquiries.length >= 4) {
    return fromInquiries;
  }

  const mockDeals = MOCK_PIPELINE.map((deal, index) => ({
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
      lastContactLabel: formatRelativeTime(inquiry.created_at) || "Recent",
      status: inquiry.status === "new" ? "new" : index % 3 === 0 ? "returning" : "hot",
    });
  });

  const buyers = Array.from(buyerMap.values());

  if (buyers.length >= 4) {
    return buyers;
  }

  MOCK_BUYERS.forEach((buyer, index) => {
    if (buyers.some((item) => item.email === buyer.email)) return;
    buyers.push({ ...buyer, id: `mock-buyer-${index}` });
  });

  return buyers;
}

function buildVisits(listings: HorseListingRow[], buyers: CrmBuyer[]): CrmVisit[] {
  const today = new Date();
  const horseNames =
    listings.length > 0
      ? listings.slice(0, 3).map((listing) => listing.name)
      : ["Grand Prix Dream", "Midnight Sovereign", "Celeste Royale"];

  const visitTemplates = [
    { dayOffset: 0, time: "10:30", location: "Indoor arena · Brabant" },
    { dayOffset: 0, time: "15:00", location: "Main stable · Utrecht" },
    { dayOffset: 2, time: "11:00", location: "Outdoor ring · Limburg" },
    { dayOffset: 5, time: "09:30", location: "Private viewing · Antwerp" },
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
      horseName: horseNames[index % horseNames.length] ?? "Featured horse",
      buyerName: buyer?.name ?? "Private buyer",
      location: template.location,
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
    title: "New inquiry",
    description: `${inquiry.buyer_name} asked about ${inquiry.horse_name}`,
    timeLabel: formatRelativeTime(inquiry.created_at) || "Recent",
    unread: inquiry.status === "new" || index === 0,
  }));

  const mockNotifications: CrmNotification[] = [
    {
      id: "notif-favorite",
      type: "favorite",
      title: "Horse favorited",
      description: "A buyer saved your listing to their shortlist",
      timeLabel: "4h ago",
      unread: true,
    },
    {
      id: "notif-profile",
      type: "profile-view",
      title: "Profile viewed",
      description: "Your seller profile received 12 views today",
      timeLabel: "6h ago",
      unread: stats.totalViews > 0,
    },
    {
      id: "notif-visit",
      type: "visit-request",
      title: "Visit requested",
      description: "Marcus Lindholm requested a stable visit this week",
      timeLabel: "Yesterday",
      unread: false,
    },
    {
      id: "notif-offer",
      type: "offer",
      title: "Offer received",
      description: "Emma Richardson submitted a preliminary offer",
      timeLabel: "2d ago",
      unread: false,
    },
  ];

  if (stats.totalFavorites > 0) {
    mockNotifications[0] = {
      ...mockNotifications[0],
      description: `Your listings received ${stats.totalFavorites} favorite${stats.totalFavorites === 1 ? "" : "s"}`,
    };
  }

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
      inquiries: metricsByListingId[listing.id]?.inquiryCount ?? 0,
    }))
    .sort((a, b) => b.views + b.favorites * 2 - (a.views + a.favorites * 2));

  const top = ranked[0];
  const mostViewed = [...ranked].sort((a, b) => b.views - a.views)[0];
  const mostSaved = [...ranked].sort((a, b) => b.favorites - a.favorites)[0];

  const conversionRate =
    stats.active > 0 ? Math.round((stats.sold / Math.max(stats.active + stats.sold, 1)) * 100) : 0;

  return {
    bestPerformingHorse: top?.name ?? "Publish a listing to track performance",
    mostViewedHorse: mostViewed?.name ?? "No views yet",
    mostViewedCount: mostViewed?.views ?? 0,
    highestSavedHorse: mostSaved?.name ?? "No favorites yet",
    highestSavedCount: mostSaved?.favorites ?? 0,
    averageResponseLabel: stats.totalInquiries > 0 ? "Under 2 hours" : "No inquiries yet",
    conversionLabel: stats.active + stats.sold > 0 ? `${conversionRate}% close rate` : "0% close rate",
  };
}

function buildAiRecommendations(listings: HorseListingRow[]): CrmAiRecommendation[] {
  const recommendations: CrmAiRecommendation[] = [
    {
      id: "ai-response",
      label: "Respond within 2 hours to increase buyer trust",
      impact: "high",
    },
  ];

  const activeListing = listings.find((listing) => listing.status === "active") ?? listings[0];

  if (activeListing) {
    if (!activeListing.video_url) {
      recommendations.push({
        id: "ai-video",
        label: "Upload a jumping video to boost engagement",
        impact: "high",
      });
    }
    if (!activeListing.public_health_summary) {
      recommendations.push({
        id: "ai-xrays",
        label: "Add x-rays to strengthen buyer confidence",
        impact: "medium",
      });
    }
    if (activeListing.description.trim().length < 120) {
      recommendations.push({
        id: "ai-description",
        label: "Improve description with training highlights and temperament",
        impact: "medium",
      });
    }
    if (activeListing.price && !activeListing.price_on_request) {
      recommendations.push({
        id: "ai-price",
        label: "Increase price by 5% based on recent market activity",
        impact: "medium",
      });
    }
  } else {
    recommendations.push(
      {
        id: "ai-listing",
        label: "Publish your first listing to unlock AI insights",
        impact: "high",
      },
      {
        id: "ai-video-mock",
        label: "Upload a jumping video when your listing goes live",
        impact: "medium",
      }
    );
  }

  return recommendations.slice(0, 5);
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

export { getBuyerInitials };
