"use server";

import {
  fetchMarketplaceFilterOptions,
  searchActiveHorseListings,
} from "@/app/lib/marketplace/search";
import { createClient } from "@/app/lib/supabase/server";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type {
  MarketplaceSearchParams,
  MarketplaceSearchResult,
} from "@/app/types/marketplace";

export async function searchMarketplaceListings(
  params: MarketplaceSearchParams = {}
): Promise<{ result: MarketplaceSearchResult; error?: string }> {
  const supabase = await createClient();
  const searchResult = await searchActiveHorseListings(supabase, params);

  return {
    result: searchResult.result,
    error: searchResult.error,
  };
}

export async function getMarketplaceFilterOptions(): Promise<{
  breeds: string[];
  countries: string[];
  disciplines: string[];
  levels: string[];
  error?: string;
}> {
  const supabase = await createClient();
  return fetchMarketplaceFilterOptions(supabase);
}

export async function getRelatedActiveListings(
  listingId: string,
  discipline: string,
  limit = 3
): Promise<{ listings: HorseListingRow[]; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("status", "active")
    .eq("discipline", discipline)
    .neq("id", listingId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    return { listings: [], error: error.message };
  }

  return { listings: (data ?? []) as HorseListingRow[] };
}
