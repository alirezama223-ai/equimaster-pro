"use server";

import { getSellerInquiries } from "@/app/actions/inquiries";
import { getMyHorseListings, getSellerListingStats } from "@/app/actions/horse-listings";
import { createClient } from "@/app/lib/supabase/server";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { SellerDashboardData, SellerDashboardListingMetrics } from "@/app/types/marketplace-public";

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

  const [listingsResult, statsResult, inquiriesResult] = await Promise.all([
    getMyHorseListings(),
    getSellerListingStats(),
    getSellerInquiries(),
  ]);

  if (listingsResult.error) {
    return { dashboard: null, error: listingsResult.error };
  }

  const listings = listingsResult.data ?? [];
  const listingIds = listings.map((listing) => listing.id);

  let favoriteRows: { horse_listing_id: string }[] = [];
  if (listingIds.length > 0) {
    const { data } = await supabase
      .from("favorites")
      .select("horse_listing_id")
      .in("horse_listing_id", listingIds);
    favoriteRows = (data ?? []) as { horse_listing_id: string }[];
  }

  let inquiryRows: { horse_listing_id: string }[] = [];
  if (listingIds.length > 0) {
    const { data } = await supabase
      .from("inquiries")
      .select("horse_listing_id")
      .eq("seller_id", user.id)
      .in("horse_listing_id", listingIds);
    inquiryRows = (data ?? []) as { horse_listing_id: string }[];
  }

  const metricsByListingId: Record<string, SellerDashboardListingMetrics> = {};

  for (const listing of listings) {
    metricsByListingId[listing.id] = {
      listingId: listing.id,
      viewCount: listing.view_count ?? 0,
      favoriteCount: 0,
      inquiryCount: 0,
    };
  }

  for (const row of favoriteRows) {
    const metrics = metricsByListingId[row.horse_listing_id];
    if (metrics) metrics.favoriteCount += 1;
  }

  for (const row of inquiryRows) {
    const metrics = metricsByListingId[row.horse_listing_id];
    if (metrics) metrics.inquiryCount += 1;
  }

  const totalViews = listings.reduce((sum, listing) => sum + (listing.view_count ?? 0), 0);
  const totalFavorites = favoriteRows.length;
  const totalInquiries = inquiryRows.length;

  return {
    dashboard: {
      stats: {
        ...statsResult.stats,
        totalViews,
        totalFavorites,
        totalInquiries,
      },
      listings: listings as HorseListingRow[],
      metricsByListingId,
      recentInquiries: inquiriesResult.inquiries.slice(0, 8),
    },
  };
}
