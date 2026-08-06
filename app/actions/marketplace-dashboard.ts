"use server";

import { getTranslations } from "next-intl/server";
import { getSellerInquiries } from "@/app/actions/inquiries";
import { getMyHorseListings, getSellerListingStats } from "@/app/actions/horse-listings";
import { buildSellerCrmData } from "@/app/components/seller-dashboard/crm/seller-crm-data";
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

  const [listingsResult, statsResult, inquiriesResult] = await Promise.all([
    getMyHorseListings(),
    getSellerListingStats(),
    getSellerInquiries(),
  ]);

  if (listingsResult.error) {
    return { dashboard: null, error: listingsResult.error };
  }

  const listings = (listingsResult.data ?? []) as ListingWithCounts[];
  const listingIds = listings.map((listing) => listing.id);
  const inquiries = inquiriesResult.inquiries;

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

  for (const row of inquiryRows) {
    const metrics = metricsByListingId[row.horse_listing_id];
    if (metrics) metrics.inquiryCount += 1;
  }

  const totalViews = listings.reduce((sum, listing) => sum + (listing.view_count ?? 0), 0);
  const totalFavorites =
    favoriteRows.length > 0
      ? favoriteRows.length
      : listings.reduce((sum, listing) => sum + (listing.favorite_count ?? 0), 0);
  const totalInquiries = inquiryRows.length;

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
      inquiries,
      recentInquiries: inquiries.slice(0, 8),
      crm: buildSellerCrmData({
        listings: listings as HorseListingRow[],
        metricsByListingId,
        inquiries,
        stats,
        priceOnRequestLabel: tCommon("priceOnRequest"),
      }),
    },
  };
}
