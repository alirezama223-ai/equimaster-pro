import { formatListingRowPrice } from "@/app/lib/horse-listings";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { ConversationPreview, MessageRow } from "@/app/types/messaging";
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

export type SellerCrmConversation = ConversationPreview & {
  buyer_id: string;
  seller_id: string;
  messages: MessageRow[];
};

function conversationToStage(
  conversation: SellerCrmConversation,
  messages: MessageRow[]
): PipelineStage {
  const sorted = [...messages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const lastMessage = sorted[0];

  if (conversation.unread_count > 0 && lastMessage?.sender_id === conversation.buyer_id) {
    return "new-inquiry";
  }

  if (messages.some((message) => message.sender_id === conversation.seller_id)) {
    return messages.length >= 4 ? "negotiating" : "contacted";
  }

  return "new-inquiry";
}

function conversationToPriority(conversation: SellerCrmConversation): PipelinePriority {
  if (conversation.unread_count > 0) return "high";
  if ((conversation.last_message_body?.length ?? 0) > 120) return "medium";
  return "low";
}

function buildPipelineFromConversations(
  conversations: SellerCrmConversation[],
  listings: HorseListingRow[],
  priceOnRequestLabel: string
): PipelineDeal[] {
  return conversations.map((conversation) => {
    const listing =
      listings.find((row) => row.id === conversation.horse_listing_id) ??
      listings.find((row) => row.name === conversation.horse_name);
    const priceLabel = listing
      ? formatListingRowPrice(listing, priceOnRequestLabel)
      : priceOnRequestLabel;

    return {
      id: `conversation-${conversation.id}`,
      buyerName: conversation.buyer_display_name,
      horseName: conversation.horse_name,
      priceLabel,
      dateAt: conversation.last_message_at ?? conversation.updated_at,
      priority: conversationToPriority(conversation),
      stage: conversationToStage(conversation, conversation.messages),
    };
  });
}

function deriveBuyerStatus(conversationsForBuyer: SellerCrmConversation[]): CrmBuyer["status"] {
  const sorted = [...conversationsForBuyer].sort(
    (a, b) =>
      new Date(b.last_message_at ?? b.updated_at).getTime() -
      new Date(a.last_message_at ?? a.updated_at).getTime()
  );
  const latest = sorted[0];

  if (conversationsForBuyer.length >= 3) return "vip";
  if (conversationsForBuyer.length >= 2) return "returning";
  if (latest?.unread_count) return "new";

  const createdAt = latest
    ? new Date(latest.last_message_at ?? latest.updated_at).getTime()
    : 0;
  const isRecent = Date.now() - createdAt < 7 * 86_400_000;
  if (isRecent) return "hot";

  return "returning";
}

function buildBuyersFromConversations(conversations: SellerCrmConversation[]): CrmBuyer[] {
  const buyerMap = new Map<string, SellerCrmConversation[]>();

  for (const conversation of conversations) {
    const key = conversation.buyer_id;
    const existing = buyerMap.get(key) ?? [];
    existing.push(conversation);
    buyerMap.set(key, existing);
  }

  return Array.from(buyerMap.entries()).map(([buyerId, buyerConversations]) => {
    const sorted = [...buyerConversations].sort(
      (a, b) =>
        new Date(b.last_message_at ?? b.updated_at).getTime() -
        new Date(a.last_message_at ?? a.updated_at).getTime()
    );
    const latest = sorted[0]!;

    return {
      id: `buyer-${buyerId}`,
      name: latest.buyer_display_name,
      email: `${buyerId.slice(0, 8)}@conversation.local`,
      interestedHorse: latest.horse_name,
      lastContactAt: latest.last_message_at ?? latest.updated_at,
      status: deriveBuyerStatus(buyerConversations),
    };
  });
}

function computeAverageResponseMs(conversations: SellerCrmConversation[]): number | null {
  const durations: number[] = [];

  for (const conversation of conversations) {
    const sorted = [...conversation.messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let waitingSince: number | null = null;

    for (const message of sorted) {
      const createdAt = new Date(message.created_at).getTime();
      if (Number.isNaN(createdAt)) continue;

      if (message.sender_id === conversation.buyer_id) {
        waitingSince = createdAt;
        continue;
      }

      if (
        message.sender_id === conversation.seller_id &&
        waitingSince !== null &&
        createdAt > waitingSince
      ) {
        durations.push(createdAt - waitingSince);
        waitingSince = null;
      }
    }
  }

  if (durations.length === 0) return null;

  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

function buildPerformance(
  listings: HorseListingRow[],
  metricsByListingId: Record<string, { viewCount: number; favoriteCount: number }>,
  conversations: SellerCrmConversation[],
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
  const averageResponseMs = computeAverageResponseMs(conversations);
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
      conversations.length === 0
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
  conversations: SellerCrmConversation[]
): CrmAiRecommendation[] {
  const recommendationIds: string[] = [];
  const hasUnreadMessages = conversations.some((conversation) => conversation.unread_count > 0);
  const activeListing = listings.find((listing) => listing.status === "active") ?? listings[0];

  if (hasUnreadMessages) {
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
  metricsByListingId: Record<string, { viewCount: number; favoriteCount: number }>;
  conversations: SellerCrmConversation[];
  notifications: CrmNotification[];
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
  conversations,
  notifications,
  stats,
  priceOnRequestLabel,
}: BuildArgs): SellerCrmData {
  return {
    pipeline: buildPipelineFromConversations(conversations, listings, priceOnRequestLabel),
    buyers: buildBuyersFromConversations(conversations),
    visits: [] as CrmVisit[],
    notifications: notifications.slice(0, 10),
    performance: buildPerformance(listings, metricsByListingId, conversations, stats),
    aiRecommendations: buildAiRecommendations(listings, conversations),
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

function attachMessagesToConversations(
  conversations: ConversationPreview[],
  messages: MessageRow[]
): SellerCrmConversation[] {
  const grouped = new Map<string, MessageRow[]>();

  for (const message of messages) {
    const existing = grouped.get(message.conversation_id) ?? [];
    existing.push(message);
    grouped.set(message.conversation_id, existing);
  }

  return conversations.map((conversation) => ({
    ...conversation,
    messages: grouped.get(conversation.id) ?? [],
  }));
}

export function buildSellerCrmConversations(
  conversations: ConversationPreview[],
  messages: MessageRow[]
): SellerCrmConversation[] {
  return attachMessagesToConversations(conversations, messages);
}

export function mapUserNotificationsToCrm(
  notifications: import("@/app/types/user-notification").NotificationRow[]
): CrmNotification[] {
  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    timeAt: notification.created_at,
    unread: notification.read_at === null,
    entityId: notification.entity_id,
  }));
}
