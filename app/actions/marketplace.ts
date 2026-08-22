"use server";

import {
  fetchBreedListingCounts,
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

export async function getBreedListingCounts(): Promise<{
  counts: Record<string, number>;
  error?: string;
}> {
  const supabase = await createClient();
  return fetchBreedListingCounts(supabase);
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

export async function getMarketplaceListingsByIds(
  listingIds: string[]
): Promise<{ listings: HorseListingRow[]; error?: string }> {
  const ids = Array.from(
    new Set(listingIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)))
  ).slice(0, 3);

  if (ids.length === 0) {
    return { listings: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("status", "active")
    .in("id", ids);

  if (error) {
    return { listings: [], error: error.message };
  }

  const listings = ((data ?? []) as HorseListingRow[]).sort(
    (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)
  );

  return { listings };
}
