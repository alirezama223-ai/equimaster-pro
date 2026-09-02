"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/admin";

const placements = ["homepage_top", "homepage_featured", "homepage_bottom"] as const;
const currencies = ["EUR", "USD", "GBP"] as const;

export type AdvertisementPricingPlan = {
  id: string;
  name: string;
  placement: typeof placements[number];
  duration_days: number;
  price: number;
  currency: typeof currencies[number];
  active: boolean;
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function getAdvertisementPricingPlans() {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { plans: [] as AdvertisementPricingPlan[], error: auth.error ?? "Forbidden" };

  const { data, error } = await auth.supabase
    .from("advertisement_pricing_plans")
    .select("id,name,placement,duration_days,price,currency,active")
    .order("active", { ascending: false })
    .order("placement", { ascending: true })
    .order("duration_days", { ascending: true });

  if (error) return { plans: [] as AdvertisementPricingPlan[], error: error.message };
  return { plans: (data ?? []) as AdvertisementPricingPlan[], error: undefined };
}

export async function createAdvertisementPricingPlan(formData: FormData) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { ok: false, error: auth.error ?? "Forbidden" };

  const name = text(formData, "name");
  const placement = text(formData, "placement");
  const durationDays = Number(text(formData, "duration_days"));
  const price = Number(text(formData, "price"));
  const currency = text(formData, "currency");

  if (name.length < 2 || name.length > 120) return { ok: false, error: "Plan name must be between 2 and 120 characters." };
  if (!placements.includes(placement as typeof placements[number])) return { ok: false, error: "Choose a valid placement." };
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) return { ok: false, error: "Duration must be 1–365 days." };
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: "Price must be zero or greater." };
  if (!currencies.includes(currency as typeof currencies[number])) return { ok: false, error: "Choose a supported currency." };

  const { error } = await auth.supabase.from("advertisement_pricing_plans").insert({
    name,
    placement,
    duration_days: durationDays,
    price,
    currency,
    active: true,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/advertisements");
  return { ok: true, error: null };
}

export async function updateAdvertisementPricingPlanStatus(formData: FormData) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { ok: false, error: auth.error ?? "Forbidden" };

  const id = text(formData, "id");
  const active = text(formData, "active") === "true";
  if (!id) return { ok: false, error: "Plan id is required." };

  const { error } = await auth.supabase
    .from("advertisement_pricing_plans")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/advertisements");
  return { ok: true, error: null };
}
