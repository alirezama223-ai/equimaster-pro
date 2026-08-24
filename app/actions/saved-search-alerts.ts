"use server";

import { createClient } from "@/app/lib/supabase/server";
import type { MarketplaceSearchParams } from "@/app/types/marketplace";

type SavedSearchAlert = {
  id: string;
  count: number;
  lastCheckedAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySavedSearchFilters(query: any, filters: MarketplaceSearchParams) {
  if (filters.breed && filters.breed !== "All") query = query.eq("breed", filters.breed);
  if (filters.country && filters.country !== "All") query = query.eq("country", filters.country);
  if (filters.gender && filters.gender !== "All") query = query.eq("gender", filters.gender);
  if (filters.discipline && filters.discipline !== "All") query = query.eq("discipline", filters.discipline);
  if (filters.level && filters.level !== "All") query = query.eq("level", filters.level);
  if (filters.color?.trim()) query = query.ilike("color", `%${filters.color.trim()}%`);
  if (filters.verified || filters.verifiedHorses) query = query.eq("verified", true);
  if (filters.verifiedSellers) query = query.eq("owner_seller_verified", true);
  if (filters.availability === "priced") query = query.eq("price_on_request", false);
  if (filters.availability === "on_request") query = query.eq("price_on_request", true);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.minAge != null) query = query.gte("age", filters.minAge);
  if (filters.maxAge != null) query = query.lte("age", filters.maxAge);
  if (filters.minHeight != null) query = query.gte("height", filters.minHeight);
  if (filters.maxHeight != null) query = query.lte("height", filters.maxHeight);

  if (filters.q?.trim()) {
    const value = filters.q.trim().replace(/[%_,]/g, " ").trim();
    const pattern = `%${value}%`;
    query = query.or(
      [
        `name.ilike.${pattern}`,
        `breed.ilike.${pattern}`,
        `discipline.ilike.${pattern}`,
        `country.ilike.${pattern}`,
        `level.ilike.${pattern}`,
        `color.ilike.${pattern}`,
        `description.ilike.${pattern}`,
        `sire.ilike.${pattern}`,
        `dam.ilike.${pattern}`,
        `dam_sire.ilike.${pattern}`,
        `seller_name.ilike.${pattern}`,
        `stable_name.ilike.${pattern}`,
      ].join(",")
    );
  }

  return query;
}

export async function getSavedSearchAlerts(): Promise<{
  alerts: SavedSearchAlert[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { alerts: [] };

  const { data: searches, error } = await supabase
    .from("saved_searches")
    .select("id, filters, last_checked_at")
    .eq("user_id", user.id);

  if (error) return { alerts: [], error: error.message };

  const alerts = await Promise.all(
    (searches ?? []).map(async (search) => {
      let query = supabase
        .from("horse_listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gt("published_at", search.last_checked_at);

      query = applySavedSearchFilters(query, search.filters as MarketplaceSearchParams);
      const result = await query;

      return {
        id: search.id as string,
        count: result.count ?? 0,
        lastCheckedAt: search.last_checked_at as string,
      };
    })
  );

  return { alerts };
}

export async function markSavedSearchChecked(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("saved_searches")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  return { ok: !error };
}
