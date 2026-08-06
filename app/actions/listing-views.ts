"use server";

import { headers } from "next/headers";
import { hashClientIp, normalizeUserAgent } from "@/app/lib/listing-views/fingerprint";
import { getClientIp } from "@/app/lib/security/request-context";
import { createClient } from "@/app/lib/supabase/server";

export async function recordListingView(listingId: string): Promise<{ recorded: boolean; error?: string }> {
  if (!listingId) {
    return { recorded: false, error: "Invalid listing." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headerStore = await headers();
  const ip = await getClientIp();
  const ipHash = hashClientIp(ip);
  const userAgent = normalizeUserAgent(headerStore.get("user-agent"));

  const { data, error } = await supabase.rpc("record_listing_view", {
    p_listing_id: listingId,
    p_viewer_id: user?.id ?? null,
    p_ip_hash: user ? null : ipHash,
    p_user_agent: user ? null : userAgent,
  });

  if (error) {
    console.error("[recordListingView] failed", {
      listingId,
      message: error.message,
      code: error.code,
    });
    return { recorded: false, error: "Unable to record listing view." };
  }

  return { recorded: Boolean(data) };
}
