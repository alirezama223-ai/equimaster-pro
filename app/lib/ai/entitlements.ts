import type { SupabaseClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/app/lib/security/rate-limit";

export type AiFeature = "horse-passport" | "training-coach";

export type PaidAiAccess =
  | { status: "allowed" }
  | { status: "denied" }
  | { status: "unavailable" };

/**
 * AI access is limited to active Pro and Enterprise subscriptions.
 * Trialing, past_due, canceled, incomplete, paused, and Free subscriptions
 * do not receive paid AI access.
 */
export function isActivePaidAiSubscription(status: unknown, planValue: unknown): boolean {
  const plan = Array.isArray(planValue) ? planValue[0] : planValue;
  if (!plan || typeof plan !== "object") return false;

  const record = plan as { slug?: unknown; active?: unknown };
  return (
    status === "active" &&
    record.active === true &&
    (record.slug === "pro" || record.slug === "enterprise")
  );
}

/**
 * Resolve access from the authenticated user's own subscription row.
 * The subscription bootstrap and lookup fail closed: no AI request is sent
 * when the database cannot confirm the user's entitlement.
 */
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

  if (!data || !isActivePaidAiSubscription(data.status, data.plans)) {
    return { status: "denied" };
  }

  return { status: "allowed" };
}

/**
 * Best-effort burst protection for a single warm server process.
 * This is not a distributed or monthly quota; use a shared persistent limiter
 * before advertising a guaranteed usage allowance.
 */
export function consumeAiBurstLimit(
  userId: string,
  feature: AiFeature
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  return checkRateLimit(`ai:${feature}:${userId}`, 5, 60_000);
}
