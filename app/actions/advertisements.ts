"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import { requireAdmin } from "@/app/lib/admin";

const placements = ["homepage_top", "homepage_featured", "homepage_bottom"] as const;
const statuses = ["draft", "pending", "active", "paused", "rejected"] as const;

export type HomepageAdvertisement = {
  id: string;
  title: string;
  advertiser_name: string;
  image_url: string;
  target_url: string | null;
  placement: typeof placements[number];
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function validateUrl(value: string) {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

export async function getHomepageAdvertisements(placement?: typeof placements[number]) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  let query = supabase
    .from("advertisements")
    .select("id,title,advertiser_name,image_url,target_url,placement")
    .eq("status", "active")
    .or(`start_at.is.null,start_at.lte.${now}`)
    .or(`end_at.is.null,end_at.gte.${now}`)
    .order("priority", { ascending: false })
    .limit(20);
  if (placement) query = query.eq("placement", placement);
  const { data, error } = await query;
  if (error) return { advertisements: [] as HomepageAdvertisement[], error: error.message };
  return { advertisements: (data ?? []) as HomepageAdvertisement[], error: null };
}

export async function getAdminAdvertisements() {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { advertisements: [], error: auth.error ?? "Forbidden" };
  const { data, error } = await auth.supabase
    .from("advertisements")
    .select("id,title,advertiser_name,image_url,target_url,placement,start_at,end_at,status,priority,impressions,clicks,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { advertisements: [], error: error.message };
  return { advertisements: data ?? [], error: null };
}

export async function createAdvertisement(formData: FormData) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { ok: false, error: auth.error ?? "Forbidden" };

  const title = text(formData, "title");
  const advertiserName = text(formData, "advertiser_name");
  const imageUrl = text(formData, "image_url");
  const targetUrl = text(formData, "target_url");
  const placement = text(formData, "placement");
  const startAt = text(formData, "start_at");
  const endAt = text(formData, "end_at");
  const priorityText = text(formData, "priority");

  if (title.length < 2 || title.length > 180) return { ok: false, error: "Title must be between 2 and 180 characters." };
  if (advertiserName.length < 2 || advertiserName.length > 180) return { ok: false, error: "Advertiser name must be between 2 and 180 characters." };
  if (!placements.includes(placement as typeof placements[number])) return { ok: false, error: "Choose a valid placement." };
  if (!imageUrl || !validateUrl(imageUrl)) return { ok: false, error: "A valid image URL is required." };
  if (!validateUrl(targetUrl)) return { ok: false, error: "Target URL must be a valid HTTP(S) URL." };
  const priority = priorityText ? Number(priorityText) : 0;
  if (!Number.isInteger(priority) || priority < 0 || priority > 1000) return { ok: false, error: "Priority must be an integer from 0 to 1000." };
  if (startAt && endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) return { ok: false, error: "End date must be after start date." };

  const { error } = await auth.supabase.from("advertisements").insert({
    title, advertiser_name: advertiserName, image_url: imageUrl, target_url: targetUrl || null,
    placement, start_at: startAt || null, end_at: endAt || null, status: "draft", priority,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/advertisements");
  revalidatePath("/");
  return { ok: true, error: null };
}

export async function updateAdvertisementStatus(formData: FormData) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { ok: false, error: auth.error ?? "Forbidden" };
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!id || !statuses.includes(status as typeof statuses[number])) return { ok: false, error: "Invalid advertisement status." };
  const { error } = await auth.supabase.from("advertisements").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/advertisements");
  revalidatePath("/");
  return { ok: true, error: null };
}