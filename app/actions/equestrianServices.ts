"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import { requireAdmin } from "@/app/lib/admin";

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

const providerSelect = "id,user_id,name,category,description,country,city,postal_code,address,latitude,longitude,phone,email,website,languages,disciplines,price_from,verified,status,created_at,updated_at";
const publicProviderSelect = "id,name,category,description,country,city,postal_code,address,latitude,longitude,phone,email,website,languages,disciplines,price_from,verified";

export async function getEquestrianServiceProviders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equestrian_service_providers")
    .select(publicProviderSelect)
    .eq("status", "active")
    .order("verified", { ascending: false })
    .order("name", { ascending: true })
    .limit(200);

  if (error) return { providers: [] as EquestrianServiceProvider[], error: error.message };
  return { providers: (data ?? []) as EquestrianServiceProvider[] };
}

export async function getEquestrianServiceProvider(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equestrian_service_providers")
    .select(publicProviderSelect)
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) return { provider: null as EquestrianServiceProvider | null, error: error.message };
  return { provider: (data ?? null) as EquestrianServiceProvider | null, error: null };
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
  revalidatePath("/admin/services");
  return { ok: true, error: null };
}

export async function getAdminEquestrianServiceProviders(status: "pending" | "active" | "rejected" | "all" = "pending") {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { providers: [], error: auth.error ?? "Forbidden" };

  let query = auth.supabase.from("equestrian_service_providers").select(providerSelect).order("created_at", { ascending: false }).limit(200);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return { providers: [], error: error.message };
  return { providers: data ?? [], error: null };
}

export async function moderateEquestrianServiceProvider(formData: FormData) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { ok: false, error: auth.error ?? "Forbidden" };

  const id = text(formData, "id");
  const action = text(formData, "action");
  if (!id || !["approve", "reject", "pause", "restore", "verify", "unverify"].includes(action)) {
    return { ok: false, error: "Invalid moderation request." };
  }

  const patch: Record<string, unknown> = {};
  if (action === "approve") patch.status = "active";
  if (action === "reject") patch.status = "rejected";
  if (action === "pause") patch.status = "paused";
  if (action === "restore") patch.status = "active";
  if (action === "verify") patch.verified = true;
  if (action === "unverify") patch.verified = false;

  const { error } = await auth.supabase.from("equestrian_service_providers").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/services");
  revalidatePath("/admin/services");
  return { ok: true, error: null };
}