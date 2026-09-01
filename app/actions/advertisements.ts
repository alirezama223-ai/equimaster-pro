"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/admin";
import { createClient } from "@/app/lib/supabase/server";

export type HomepageAdvertisement = {
  id: string;
  title: string;
  advertiser_name: string;
  image_url: string | null;
  target_url: string | null;
  alt_text: string | null;
  status: "pending" | "active" | "paused" | "expired";
  starts_at: string;
  ends_at: string | null;
  priority: number;
};

const PUBLIC_FIELDS = "id,title,advertiser_name,image_url,target_url,alt_text,status,starts_at,ends_at,priority";

export async function getActiveHomepageAdvertisements(): Promise<HomepageAdvertisement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("homepage_advertisements")
    .select(PUBLIC_FIELDS)
    .eq("status", "active")
    .lte("starts_at", new Date().toISOString())
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Failed to load homepage advertisements", error);
    return [];
  }

  return (data ?? []) as HomepageAdvertisement[];
}

export async function getAdminAdvertisements(): Promise<{
  advertisements: HomepageAdvertisement[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { advertisements: [], error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("homepage_advertisements")
    .select(PUBLIC_FIELDS)
    .order("status", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return { advertisements: [], error: error.message };
  return { advertisements: (data ?? []) as HomepageAdvertisement[] };
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function createHomepageAdvertisement(formData: FormData) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) return { error: auth.error ?? "Forbidden" };

  const title = text(formData, "title");
  const advertiserName = text(formData, "advertiser_name");
  const imageUrl = optionalUrl(text(formData, "image_url"));
  const targetUrl = optionalUrl(text(formData, "target_url"));
  const altText = text(formData, "alt_text") || null;
  const startsAt = text(formData, "starts_at") || new Date().toISOString();
  const endsAt = text(formData, "ends_at") || null;
  const priorityRaw = Number(text(formData, "priority") || "0");

  if (!title || !advertiserName) return { error: "Title and advertiser name are required." };
  if (text(formData, "image_url") && !imageUrl) return { error: "Image URL must be a valid HTTPS URL." };
  if (text(formData, "target_url") && !targetUrl) return { error: "Target URL must be a valid HTTPS URL." };

  const { error } = await auth.supabase.from("homepage_advertisements").insert({
    title,
    advertiser_name: advertiserName,
    image_url: imageUrl,
    target_url: targetUrl,
    alt_text: altText,
    status: "pending",
    starts_at: startsAt,
    ends_at: endsAt,
    priority: Number.isFinite(priorityRaw) ? Math.trunc(priorityRaw) : 0,
    created_by: auth.user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/advertisements");
  return { success: true };
}

export async function setHomepageAdvertisementStatus(id: string, status: "pending" | "active" | "paused" | "expired") {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Forbidden" };

  const { error } = await auth.supabase
    .from("homepage_advertisements")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/advertisements");
  return { success: true };
}
