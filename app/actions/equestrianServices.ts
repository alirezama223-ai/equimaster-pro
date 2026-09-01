"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

export type EquestrianServiceProvider = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  country: string;
  city: string;
  postal_code: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  languages: string[];
  disciplines: string[];
  price_from: number | null;
  verified: boolean;
};

export async function getEquestrianServiceProviders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equestrian_service_providers")
    .select("id,name,category,description,country,city,postal_code,address,latitude,longitude,phone,email,website,languages,disciplines,price_from,verified")
    .eq("status", "active")
    .order("verified", { ascending: false })
    .order("name", { ascending: true })
    .limit(200);

  if (error) return { providers: [] as EquestrianServiceProvider[], error: error.message };
  return { providers: (data ?? []) as EquestrianServiceProvider[] };
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function list(formData: FormData, key: string) {
  return text(formData, key).split(",").map((value) => value.trim()).filter(Boolean).slice(0, 20);
}

export async function createEquestrianServiceProvider(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to submit a service." };

  const name = text(formData, "name");
  const category = text(formData, "category");
  const country = text(formData, "country");
  const city = text(formData, "city");
  const description = text(formData, "description");
  const validCategories = ["riding_school", "trainer", "horse_training", "livery", "veterinary", "farrier", "physiotherapy", "transport", "shop", "competition_coaching", "other"];

  if (name.length < 2 || name.length > 160) return { ok: false, error: "Name must be between 2 and 160 characters." };
  if (!validCategories.includes(category)) return { ok: false, error: "Choose a valid service category." };
  if (!country || !city) return { ok: false, error: "Country and city are required." };
  if (description.length > 3000) return { ok: false, error: "Description is too long." };

  const latText = text(formData, "latitude");
  const lngText = text(formData, "longitude");
  const priceText = text(formData, "price_from");
  const latitude = latText ? Number(latText) : null;
  const longitude = lngText ? Number(lngText) : null;
  const priceFrom = priceText ? Number(priceText) : null;
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) return { ok: false, error: "Invalid latitude." };
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) return { ok: false, error: "Invalid longitude." };
  if (priceFrom !== null && (!Number.isFinite(priceFrom) || priceFrom < 0)) return { ok: false, error: "Invalid starting price." };

  const { error } = await supabase.from("equestrian_service_providers").insert({
    user_id: user.id,
    name,
    category,
    description: description || null,
    country,
    city,
    postal_code: text(formData, "postal_code") || null,
    address: text(formData, "address") || null,
    latitude,
    longitude,
    phone: text(formData, "phone") || null,
    email: text(formData, "email") || null,
    website: text(formData, "website") || null,
    languages: list(formData, "languages"),
    disciplines: list(formData, "disciplines"),
    price_from: priceFrom,
    status: "pending",
    verified: false,
  });

  if (error) return { ok: false, error: "Unable to submit this service right now." };
  revalidatePath("/services");
  return { ok: true, error: null };
}
