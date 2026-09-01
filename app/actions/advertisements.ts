"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import { requireAdmin } from "@/app/lib/admin";

const placements = ["homepage_top", "homepage_featured", "homepage_bottom"] as const;
const statuses = ["draft", "pending", "active", "paused", "rejected", "expired"] as const;

export type HomepageAdvertisement = {
  id: string;
  title: string;
  advertiser_name: string;
  image_url: string;
  target_url: string | null;
  placement: typeof placements[number];
};

type AdminAdvertisement = HomepageAdvertisement & {
  start_at: string;
  end_at: string;
  status: typeof statuses[number];
  priority: number;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at: string;
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function validateUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function getHomepageAdvertisements(placement?: typeof placements[number]) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  let query = supabase
    .from("advertisements")
    .select("id,title,advertiser_name,image_url,target_url,placement")
    .eq("status", "active")
    .lte("start_at", now)
    .gte("end_at", now)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (placement) query = query.eq("placement", placement);

  const { data, error } = await query;
  if (error) return { advertisements: [] as HomepageAdvertisement[], error: error.message };
  return { advertisements: (data ?? []) as HomepageAdvertisement[], error: null };
}

export async function getAdminAdvertisements(): Promise<{
  advertisements: AdminAdvertisement[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { advertisements: [], error: auth.error ?? "Forbidden" };

  const { data, error } = await auth.supabase
    .from("advertisements")
    .select("id,title,advertiser_name,image_url,target_url,placement,start_at,end_at,status,priority,impressions,clicks,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return { advertisements: [], error: error.message };
  return { advertisements: (data ?? []) as AdminAdvertisement[], error: undefined };
}

export async function createAdvertisement(formData: FormData) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) return { ok: false, error: auth.error ?? "Forbidden" };

  const title = text(formData, "title");
  const advertiserName = text(formData, "advertiser_name");
  const imageUrl = text(formData, "image_url");
  const targetUrl = text(formData, "target_url");
  const placement = text(formData, "placement");
  const startAt = text(formData, "start_at");
  const endAt = text(formData, "end_at");
  const priorityText = text(formData, "priority");

  if (title.length < 2 || title.length > 200) return { ok: false, error: "Title must be between 2 and 200 characters." };
  if (advertiserName.length < 2 || advertiserName.length > 160) return { ok: false, error: "Advertiser name must be between 2 and 160 characters." };
  if (!placements.includes(placement as typeof placements[number])) return { ok: false, error: "Choose a valid placement." };
  if (!imageUrl || !validateUrl(imageUrl)) return { ok: false, error: "A valid image URL is required." };
  if (!targetUrl || !validateUrl(targetUrl)) return { ok: false, error: "A valid target URL is required." };

  const priority = priorityText ? Number(priorityText) : 0;
  if (!Number.isInteger(priority) || priority < 0 || priority > 1000) return { ok: false, error: "Priority must be an integer from 0 to 1000." };

  const startDate = startAt ? new Date(startAt) : new Date();
  const endDate = endAt ? new Date(endAt) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) return { ok: false, error: "End date must be after start date." };

  const { error } = await auth.supabase.from("advertisements").insert({
    title,
    advertiser_name: advertiserName,
    image_url: imageUrl,
    target_url: targetUrl,
    placement,
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString(),
    status: "draft",
    priority,
    created_by: auth.user.id,
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

  const { error } = await auth.supabase
    .from("advertisements")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/advertisements");
  revalidatePath("/");
  return { ok: true, error: null };
}
