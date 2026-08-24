"use server";

import { createClient } from "@/app/lib/supabase/server";
import { searchActiveHorseListings } from "@/app/lib/marketplace/search";
import type { MarketplaceSearchParams } from "@/app/types/marketplace";

type SavedSearchAlert = {
  id: string;
  count: number;
  lastCheckedAt: string;
};

const ALERT_PAGE_SIZE = 1000;

/**
 * Count new matches through the same Marketplace search engine used by the UI.
 * We intentionally filter published_at after retrieval for v1 so radius/studbook
 * searches use their existing RPC path without maintaining a second filter engine.
 */
async function countNewMatches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: MarketplaceSearchParams,
  lastCheckedAt: string
): Promise<number> {
  let page = 1;
  let count = 0;

  while (true) {
    const { result, error } = await searchActiveHorseListings(supabase, {
      ...filters,
      page,
      pageSize: ALERT_PAGE_SIZE,
    });

    if (error) {
      throw new Error(error);
    }

    count += result.listings.filter((listing) => {
      if (!listing.published_at) return false;
      return new Date(listing.published_at).getTime() > new Date(lastCheckedAt).getTime();
    }).length;

    if (page >= result.totalPages || result.listings.length === 0) {
      return count;
    }

    page += 1;
  }
}

export async function getSavedSearchAlerts(): Promise<{
  alerts: SavedSearchAlert[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { alerts: [] };

  const { data: searches, error } = await supabase
    .from("saved_searches")
    .select("id, filters, last_checked_at")
    .eq("user_id", user.id);

  if (error) return { alerts: [], error: error.message };

  try {
    const alerts = await Promise.all(
      (searches ?? []).map(async (search) => ({
        id: search.id as string,
        count: await countNewMatches(
          supabase,
          search.filters as MarketplaceSearchParams,
          search.last_checked_at as string
        ),
        lastCheckedAt: search.last_checked_at as string,
      }))
    );

    return { alerts };
  } catch (alertError) {
    return {
      alerts: [],
      error: alertError instanceof Error ? alertError.message : "Unable to load saved search alerts.",
    };
  }
}

export async function markSavedSearchChecked(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("saved_searches")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  return { ok: !error };
}
