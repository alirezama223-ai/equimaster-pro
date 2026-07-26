"use server";

import { revalidatePath } from "next/cache";
import { listingRowToHorse } from "@/app/lib/horse-listings";
import { createClient } from "@/app/lib/supabase/server";
import { HorseListingRow } from "@/app/types/horse-listing";
import { Horse } from "@/app/data/horses";

type FavoriteListingJoin = {
  horse_listing_id: string;
  created_at: string;
  horse_listings: HorseListingRow | HorseListingRow[] | null;
};

function normalizeJoinedListing(
  value: HorseListingRow | HorseListingRow[] | null
): HorseListingRow | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
}

function revalidateFavoritePaths(listingId: string) {
  revalidatePath("/");
  revalidatePath("/favorites");
  revalidatePath(`/horse/${listingId}`);
}

export async function getUserFavoriteListingIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("horse_listing_id")
    .eq("user_id", user.id);

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.horse_listing_id as string);
}

export async function getUserFavoriteHorses(): Promise<{
  horses: Horse[];
  favoriteListingIds: string[];
  unauthenticated?: true;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { horses: [], favoriteListingIds: [], unauthenticated: true };
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("horse_listing_id, created_at, horse_listings (*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      horses: [],
      favoriteListingIds: [],
      error: error.message,
    };
  }

  const rows = (data ?? []) as unknown as FavoriteListingJoin[];
  const horses: Horse[] = [];
  const favoriteListingIds: string[] = [];

  for (const row of rows) {
    const listing = normalizeJoinedListing(row.horse_listings);
    if (!listing || listing.status !== "active") {
      continue;
    }

    favoriteListingIds.push(row.horse_listing_id);
    horses.push(listingRowToHorse(listing));
  }

  return { horses, favoriteListingIds };
}

export async function addFavorite(horseListingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to save favorites.", unauthenticated: true as const };
  }

  const { data: listing, error: listingError } = await supabase
    .from("horse_listings")
    .select("id")
    .eq("id", horseListingId)
    .eq("status", "active")
    .maybeSingle();

  if (listingError || !listing) {
    return { error: "This listing is not available to favorite." };
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    horse_listing_id: horseListingId,
  });

  if (error) {
    if (error.code === "23505") {
      revalidateFavoritePaths(horseListingId);
      return { data: { favorited: true as const } };
    }

    return { error: "Unable to save this horse to favorites right now." };
  }

  revalidateFavoritePaths(horseListingId);
  return { data: { favorited: true as const } };
}

export async function removeFavorite(horseListingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to manage favorites.", unauthenticated: true as const };
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("horse_listing_id", horseListingId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Unable to remove this horse from favorites right now." };
  }

  revalidateFavoritePaths(horseListingId);
  return { data: { favorited: false as const } };
}

export async function isListingFavorited(horseListingId: string): Promise<boolean> {
  const favoriteIds = await getUserFavoriteListingIds();
  return favoriteIds.includes(horseListingId);
}
