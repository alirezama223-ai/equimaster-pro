import { createClient } from "@supabase/supabase-js";

export type ModerationStatus = "pending" | "active" | "paused" | "closed" | "rejected";

export async function moderateListing(
  listingId: string,
  status: ModerationStatus,
  reason?: string,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase server configuration is incomplete");

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.rpc("moderate_equimarket_listing", {
    p_listing_id: listingId,
    p_to_status: status,
    p_reason: reason ?? null,
  });
  if (error) throw error;
  return data;
}
