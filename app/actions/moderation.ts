"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

export type ModerationStatus = "active" | "rejected" | "paused" | "closed";
export type ModerationKind = "equimarket" | "horse_sale";

type ModerationListing = {
  id: string;
  kind: ModerationKind;
  title: string;
  description: string;
  discipline: string | null;
  level: string | null;
  country: string | null;
  city: string | null;
  price: number | null;
  pricePeriod: string | null;
  horseName: string | null;
  createdAt: string;
};

async function requireModerator() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { supabase, user: null, error: "Authentication required." };

  const { data, error } = await supabase.rpc("is_moderator");
  if (error || data !== true) return { supabase, user: null, error: "You are not authorized to moderate listings." };
  return { supabase, user, error: null };
}

export async function getPendingModerationListings() {
  const auth = await requireModerator();
  if (!auth.user) return { listings: [] as ModerationListing[], error: auth.error };

  const { data, error } = await auth.supabase.rpc("get_pending_moderation_listings");
  if (error) return { listings: [] as ModerationListing[], error: error.message };

  return {
    listings: (Array.isArray(data) ? data : []) as ModerationListing[],
    error: null,
  };
}

export async function getModerationListingDetails(kind: ModerationKind, listingId: string) {
  const auth = await requireModerator();
  if (!auth.user) return { listing: null, error: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) return { listing: null, error: "Invalid listing." };

  const { data, error } = await auth.supabase.rpc("get_moderation_listing_details", {
    p_kind: kind,
    p_listing_id: listingId,
  });

  if (error) return { listing: null, error: error.message };
  if (!data || typeof data !== "object") return { listing: null, error: "Listing not found." };

  return { listing: data as Record<string, unknown>, error: null };
}

export async function moderateListing(
  kind: ModerationKind,
  listingId: string,
  status: ModerationStatus,
  reason: string,
  _formData: FormData,
): Promise<void> {
  const auth = await requireModerator();
  if (!auth.user) throw new Error(auth.error ?? "Authentication required.");
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) throw new Error("Invalid listing.");

  const rpc = kind === "horse_sale" ? "moderate_horse_listing" : "moderate_equimarket_listing";
  const { error } = await auth.supabase.rpc(rpc, {
    p_listing_id: listingId,
    p_to_status: status,
    p_reason: reason.trim() || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/moderation");
  revalidatePath("/services");
  revalidatePath("/marketplace");
}
