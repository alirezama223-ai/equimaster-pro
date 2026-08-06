"use server";

import { getTranslations } from "next-intl/server";
import { getMyHorseListings, getSellerListingStats } from "@/app/actions/horse-listings";
import { getSellerConversationsWithMessages } from "@/app/actions/messaging";
import { getRecentNotifications } from "@/app/actions/user-notifications";
import {
  buildSellerCrmConversations,
  buildSellerCrmData,
  mapUserNotificationsToCrm,
} from "@/app/components/seller-dashboard/crm/seller-crm-data";
import { createClient } from "@/app/lib/supabase/server";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { SellerDashboardData, SellerDashboardListingMetrics } from "@/app/types/marketplace-public";

type ListingWithCounts = HorseListingRow & {
  favorite_count?: number | null;
  inquiry_count?: number | null;
};

export async function getSellerDashboardData(): Promise<{
  dashboard: SellerDashboardData | null;
  error?: string;
  unauthenticated?: true;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { dashboard: null, unauthenticated: true };
  }

  const [listingsResult, statsResult, messagingResult, notificationsResult] = await Promise.all([
    getMyHorseListings(),
    getSellerListingStats(),
    getSellerConversationsWithMessages(),
    getRecentNotifications(10),
  ]);

  if (listingsResult.error) {
    return { dashboard: null, error: listingsResult.error };
  }

  const listings = (listingsResult.data ?? []) as ListingWithCounts[];
  const listingIds = listings.map((listing) => listing.id);
  const conversations = messagingResult.conversations;
  const crmConversations = buildSellerCrmConversations(
    conversations,
    messagingResult.messages
  );

  let favoriteRows: { horse_listing_id: string }[] = [];
  if (listingIds.length > 0) {
    const { data } = await supabase
      .from("favorites")
      .select("horse_listing_id")
      .in("horse_listing_id", listingIds);
    favoriteRows = (data ?? []) as { horse_listing_id: string }[];
  }

  const metricsByListingId: Record<string, SellerDashboardListingMetrics> = {};

  for (const listing of listings) {
    metricsByListingId[listing.id] = {
      listingId: listing.id,
      viewCount: listing.view_count ?? 0,
      favoriteCount: listing.favorite_count ?? 0,
      inquiryCount: 0,
    };
  }

  for (const row of favoriteRows) {
    const metrics = metricsByListingId[row.horse_listing_id];
    if (metrics) metrics.favoriteCount += 1;
  }

  for (const listing of listings) {
    const metrics = metricsByListingId[listing.id];
    if (metrics && listing.favorite_count != null && favoriteRows.length === 0) {
      metrics.favoriteCount = listing.favorite_count;
    }
  }

  for (const conversation of conversations) {
    const metrics = metricsByListingId[conversation.horse_listing_id];
    if (metrics) metrics.inquiryCount += 1;
  }

  const totalViews = listings.reduce((sum, listing) => sum + (listing.view_count ?? 0), 0);
  const totalFavorites =
    favoriteRows.length > 0
      ? favoriteRows.length
      : listings.reduce((sum, listing) => sum + (listing.favorite_count ?? 0), 0);
  const totalInquiries = conversations.length;

  const tCommon = await getTranslations("common");
  const stats = {
    ...statsResult.stats,
    totalViews,
    totalFavorites,
    totalInquiries,
  };

  return {
    dashboard: {
      stats,
      listings: listings as HorseListingRow[],
      metricsByListingId,
      conversations,
      recentConversations: conversations.slice(0, 8),
      crm: buildSellerCrmData({
        listings: listings as HorseListingRow[],
        metricsByListingId,
        conversations: crmConversations,
        notifications: mapUserNotificationsToCrm(notificationsResult.notifications),
        stats,
        priceOnRequestLabel: tCommon("priceOnRequest"),
      }),
    },
  };
}
