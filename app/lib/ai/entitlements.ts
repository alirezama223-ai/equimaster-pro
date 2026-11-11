import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AiFeature = "horse-passport" | "training-coach";

export type PaidAiAccess =
  | { status: "allowed" }
  | { status: "denied" }
  | { status: "unavailable" };

export type AiUsageReservation =
  | { status: "reserved"; requestId: string; used: number; quota: number; remaining: number; periodEnd: string | null }
  | { status: "quota_exceeded"; used: number; quota: number; remaining: number; periodEnd: string | null }
  | { status: "subscription_required" }
  | { status: "unavailable" };

export function isActivePaidAiSubscription(status: unknown, planValue: unknown): boolean {
  const plan = Array.isArray(planValue) ? planValue[0] : planValue;
  if (!plan || typeof plan !== "object") return false;
  const record = plan as { slug?: unknown; active?: unknown };
  return status === "active" && record.active === true &&
    (record.slug === "pro" || record.slug === "enterprise");
}

export async function getPaidAiAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<PaidAiAccess> {
  const { error: bootstrapError } = await supabase.rpc("ensure_user_subscription", {
    p_user_id: userId,
  });
  if (bootstrapError) {
    console.error("[ai-access] Unable to initialize subscription:", bootstrapError.message);
    return { status: "unavailable" };
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, plans(slug, active)")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[ai-access] Unable to verify subscription:", error.message);
    return { status: "unavailable" };
  }
  return data && isActivePaidAiSubscription(data.status, data.plans)
    ? { status: "allowed" }
    : { status: "denied" };
}

/** Reserve quota atomically before calling a paid AI provider. */
export async function reservePaidAiUsage(
  supabase: SupabaseClient,
  feature: AiFeature
): Promise<AiUsageReservation> {
  const requestId = randomUUID();
  const { data, error } = await supabase.rpc("reserve_ai_usage", {
    p_request_id: requestId,
    p_feature: feature,
  });

  if (error || !Array.isArray(data) || !data[0]) {
    console.error("[ai-usage] Unable to reserve AI usage:", error?.message ?? "Empty RPC result");
    return { status: "unavailable" };
  }

  const row = data[0] as {
    allowed: boolean; reason: string; used: number; quota: number;
    remaining: number; period_end: string | null;
  };

  if (row.allowed) {
    return {
      status: "reserved", requestId, used: Number(row.used),
      quota: Number(row.quota), remaining: Number(row.remaining),
      periodEnd: row.period_end ?? null,
    };
  }
  if (row.reason === "quota_exceeded") {
    return {
      status: "quota_exceeded", used: Number(row.used), quota: Number(row.quota),
      remaining: Number(row.remaining), periodEnd: row.period_end ?? null,
    };
  }
  if (row.reason === "subscription_required" || row.reason === "subscription_period_expired") {
    return { status: "subscription_required" };
  }
  return { status: "unavailable" };
}

/** Commit successful calls to usage; release reservations after failed calls. */
export async function finalizePaidAiUsage(
  supabase: SupabaseClient,
  requestId: string,
  success: boolean
): Promise<void> {
  const { data, error } = await supabase.rpc("finalize_ai_usage", {
    p_request_id: requestId,
    p_success: success,
  });
  if (error || data !== true) {
    console.error("[ai-usage] Unable to finalize AI usage reservation:", error?.message ?? "Reservation not finalized");
  }
}
