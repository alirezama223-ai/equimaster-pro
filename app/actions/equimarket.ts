"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

export type EquiMarketListing = {
  id: string;
  listing_type: "horse_rental" | "horse_wanted";
  title: string;
  description: string;
  horse_name: string | null;
  discipline: string | null;
  level: string | null;
  country: string | null;
  city: string | null;
  price: number | null;
  price_period: string | null;
  available_from: string | null;
  available_to: string | null;
  min_duration_weeks: number | null;
  competition_allowed: boolean;
  coach_included: boolean;
  status: string;
  created_at: string;
};

export async function getEquiMarketListings(type?: "horse_rental" | "horse_wanted") {
  const supabase = await createClient();
  let query = supabase
    .from("equimarket_listings")
    .select("id, listing_type, title, description, horse_name, discipline, level, country, city, price, price_period, available_from, available_to, min_duration_weeks, competition_allowed, coach_included, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);

  if (type) query = query.eq("listing_type", type);
  const { data, error } = await query;
  if (error) return { listings: [] as EquiMarketListing[], error: error.message };
  return { listings: (data ?? []) as EquiMarketListing[] };
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createEquiMarketListing(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to publish a listing." };

  const listingType = text(formData, "listing_type");
  const title = text(formData, "title");
  const description = text(formData, "description");
  if (listingType !== "horse_rental" && listingType !== "horse_wanted") return { ok: false, error: "Choose a valid listing type." };
  if (title.length < 5 || title.length > 140) return { ok: false, error: "Title must be between 5 and 140 characters." };
  if (description.length < 10 || description.length > 5000) return { ok: false, error: "Description must be between 10 and 5000 characters." };

  const priceValue = text(formData, "price");
  const minDuration = text(formData, "min_duration_weeks");
  const { error } = await supabase.from("equimarket_listings").insert({
    user_id: user.id,
    listing_type: listingType,
    title,
    description,
    horse_name: text(formData, "horse_name") || null,
    discipline: text(formData, "discipline") || null,
    level: text(formData, "level") || null,
    country: text(formData, "country") || null,
    city: text(formData, "city") || null,
    price: priceValue ? Number(priceValue) : null,
    price_period: text(formData, "price_period") || null,
    available_from: text(formData, "available_from") || null,
    available_to: text(formData, "available_to") || null,
    min_duration_weeks: minDuration ? Number(minDuration) : null,
    competition_allowed: formData.get("competition_allowed") === "on",
    coach_included: formData.get("coach_included") === "on",
    status: "pending",
  });

  if (error) return { ok: false, error: "Unable to submit this listing right now." };
  revalidatePath("/services");
  return { ok: true, error: null };
}
