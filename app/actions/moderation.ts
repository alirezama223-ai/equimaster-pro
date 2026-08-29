"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

export type ModerationStatus = "active" | "rejected" | "paused" | "closed";

async function requireModerator() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { supabase, user: null, error: "Authentication required." };

  const { data, error } = await supabase.rpc("is_moderator");
  if (error || data !== true) return { supabase, user: null, error: "You are not authorized to moderate listings." };
  return { supabase, user, error: null };
}

export async function getPendingEquiMarketListings() {
  const auth = await requireModerator();
  if (!auth.user) return { listings: [], error: auth.error };

  const { data, error } = await auth.supabase
    .from("equimarket_listings")
    .select("id, listing_type, title, description, horse_name, discipline, level, country, city, price, price_period, available_from, available_to, min_duration_weeks, competition_allowed, coach_included, status, created_at, user_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return { listings: [], error: error.message };
  return { listings: data ?? [], error: null };
}

export async function moderateEquiMarketListing(
  listingId: string,
  status: ModerationStatus,
  reason?: string,
  _formData?: FormData,
) {
  const auth = await requireModerator();
  if (!auth.user) return { ok: false, error: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) return { ok: false, error: "Invalid listing." };

  const { error } = await auth.supabase.rpc("moderate_equimarket_listing", {
    p_listing_id: listingId,
    p_to_status: status,
    p_reason: reason?.trim() || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/moderation");
  revalidatePath("/services");
  return { ok: true, error: null };
}
