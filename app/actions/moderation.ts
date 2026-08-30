"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
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

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase server configuration is incomplete");
  return createSupabaseAdmin(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getPendingModerationListings() {
  const auth = await requireModerator();
  if (!auth.user) return { listings: [] as ModerationListing[], error: auth.error };

  // Authorization is checked above with the user's session. Use the server-only
  // service client for queue reads so RLS on marketplace tables cannot block the
  // moderator dashboard. The service key never reaches the browser.
  const admin = createAdminClient();

  const [equiResult, horseResult] = await Promise.all([
    admin
      .from("equimarket_listings")
      .select("id, title, description, discipline, level, country, city, price, price_period, horse_name, created_at, listing_type")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100),
    admin
      .from("horse_listings")
      .select("id, name, description, discipline, level, country, price, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100),
  ]);

  if (equiResult.error) return { listings: [] as ModerationListing[], error: equiResult.error.message };
  if (horseResult.error) return { listings: [] as ModerationListing[], error: horseResult.error.message };

  const equi = (equiResult.data ?? []).map((item) => ({
    id: item.id,
    kind: "equimarket" as const,
    title: item.title,
    description: item.description,
    discipline: item.discipline,
    level: item.level,
    country: item.country,
    city: item.city,
    price: item.price,
    pricePeriod: item.price_period,
    horseName: item.horse_name,
    createdAt: item.created_at,
  }));

  const horses = (horseResult.data ?? []).map((item) => ({
    id: item.id,
    kind: "horse_sale" as const,
    title: item.name,
    description: item.description,
    discipline: item.discipline,
    level: item.level,
    country: item.country,
    city: null,
    price: item.price,
    pricePeriod: null,
    horseName: item.name,
    createdAt: item.created_at,
  }));

  return {
    listings: [...equi, ...horses].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    error: null,
  };
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
