"use server";

import { createClient } from "@/app/lib/supabase/server";
import type { MarketplaceSearchParams } from "@/app/types/marketplace";

type SavedSearchRow = {
  id: string;
  name: string;
  filters: MarketplaceSearchParams;
  created_at: string;
  updated_at: string;
  last_checked_at: string;
};

function isValidName(name: string) {
  return name.trim().length > 0 && name.trim().length <= 80;
}

export async function getUserSavedSearches(): Promise<{
  searches: SavedSearchRow[];
  unauthenticated?: true;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { searches: [], unauthenticated: true };
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, name, filters, created_at, updated_at, last_checked_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return { searches: [], error: error.message };
  }

  return { searches: (data ?? []) as SavedSearchRow[] };
}

export async function createSavedSearch(
  name: string,
  filters: MarketplaceSearchParams
): Promise<{ data?: SavedSearchRow; unauthenticated?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to save a search.", unauthenticated: true };
  }

  const trimmedName = name.trim();
  if (!isValidName(trimmedName)) {
    return { error: "Search name must be between 1 and 80 characters." };
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      user_id: user.id,
      name: trimmedName,
      filters,
    })
    .select("id, name, filters, created_at, updated_at, last_checked_at")
    .single();

  if (error) {
    return { error: "Unable to save this search right now." };
  }

  return { data: data as SavedSearchRow };
}

export async function deleteSavedSearch(id: string): Promise<{
  data?: { deleted: true };
  unauthenticated?: true;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to manage saved searches.", unauthenticated: true };
  }

  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Unable to delete this saved search right now." };
  }

  return { data: { deleted: true } };
}
