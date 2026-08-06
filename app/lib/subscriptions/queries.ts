import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BillingHistoryRow,
  PlanFeatures,
  PlanRow,
  SubscriptionRow,
  SubscriptionSnapshot,
  SubscriptionUsageSnapshot,
} from "@/app/types/subscription";
import { LISTING_QUOTA_ERROR_CODE } from "@/app/types/subscription";

function mapPlanRow(row: Record<string, unknown>): PlanRow {
  return {
    id: String(row.id),
    slug: row.slug as PlanRow["slug"],
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    max_active_listings:
      row.max_active_listings == null ? null : Number(row.max_active_listings),
    featured_listings: Boolean(row.featured_listings),
    verification_priority: Boolean(row.verification_priority),
    analytics_enabled: Boolean(row.analytics_enabled),
    crm_enabled: Boolean(row.crm_enabled),
    unlimited_messaging: Boolean(row.unlimited_messaging),
    premium_support: Boolean(row.premium_support),
    unlimited_staff: Boolean(row.unlimited_staff),
    multiple_seller_accounts: Boolean(row.multiple_seller_accounts),
    api_access: Boolean(row.api_access),
    stripe_price_id_monthly: row.stripe_price_id_monthly
      ? String(row.stripe_price_id_monthly)
      : null,
    stripe_price_id_yearly: row.stripe_price_id_yearly
      ? String(row.stripe_price_id_yearly)
      : null,
    monthly_price_cents: Number(row.monthly_price_cents ?? 0),
    yearly_price_cents: Number(row.yearly_price_cents ?? 0),
    sort_order: Number(row.sort_order ?? 0),
    active: Boolean(row.active ?? true),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapSubscriptionRow(row: Record<string, unknown>): SubscriptionRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    plan_id: String(row.plan_id),
    status: row.status as SubscriptionRow["status"],
    billing_interval:
      row.billing_interval === "month" || row.billing_interval === "year"
        ? row.billing_interval
        : null,
    stripe_customer_id: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripe_subscription_id: row.stripe_subscription_id
      ? String(row.stripe_subscription_id)
      : null,
    current_period_start: row.current_period_start
      ? String(row.current_period_start)
      : null,
    current_period_end: row.current_period_end ? String(row.current_period_end) : null,
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
    canceled_at: row.canceled_at ? String(row.canceled_at) : null,
    trial_end: row.trial_end ? String(row.trial_end) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function planRowToFeatures(plan: PlanRow): PlanFeatures {
  return {
    maxActiveListings: plan.max_active_listings,
    featuredListings: plan.featured_listings,
    verificationPriority: plan.verification_priority,
    analyticsEnabled: plan.analytics_enabled,
    crmEnabled: plan.crm_enabled,
    unlimitedMessaging: plan.unlimited_messaging,
    premiumSupport: plan.premium_support,
    unlimitedStaff: plan.unlimited_staff,
    multipleSellerAccounts: plan.multiple_seller_accounts,
    apiAccess: plan.api_access,
  };
}

export async function ensureUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase.rpc("ensure_user_subscription", { p_user_id: userId });
}

export async function getActiveListingCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("horse_listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export function buildUsageSnapshot(
  activeListings: number,
  listingLimit: number | null
): SubscriptionUsageSnapshot {
  const remainingListings =
    listingLimit == null ? null : Math.max(listingLimit - activeListings, 0);

  return {
    activeListings,
    listingLimit,
    remainingListings,
    atLimit: listingLimit != null && activeListings >= listingLimit,
  };
}

export async function getUserSubscriptionSnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionSnapshot | null> {
  await ensureUserSubscription(supabase, userId);

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const planData = data.plans as Record<string, unknown> | null;
  if (!planData) {
    return null;
  }

  const plan = mapPlanRow(planData);
  const subscription = mapSubscriptionRow(data as Record<string, unknown>);
  const activeListings = await getActiveListingCount(supabase, userId);
  const features = planRowToFeatures(plan);
  const usage = buildUsageSnapshot(activeListings, features.maxActiveListings);
  const isPaid = plan.slug !== "free" && subscription.status === "active";

  return {
    plan,
    subscription,
    features,
    usage,
    isPaid,
    canUpgrade: plan.slug !== "enterprise",
    canManageBilling: Boolean(subscription.stripe_customer_id),
  };
}

export async function assertCanActivateListing(
  supabase: SupabaseClient,
  userId: string,
  options?: { excludeListingId?: string }
): Promise<{ ok: true } | { ok: false; error: string; errorCode: typeof LISTING_QUOTA_ERROR_CODE; quota: SubscriptionUsageSnapshot }> {
  const snapshot = await getUserSubscriptionSnapshot(supabase, userId);

  if (!snapshot) {
    return {
      ok: false,
      error: "Unable to verify your subscription quota.",
      errorCode: LISTING_QUOTA_ERROR_CODE,
      quota: buildUsageSnapshot(0, 3),
    };
  }

  let activeListings = snapshot.usage.activeListings;

  if (options?.excludeListingId) {
    const { data } = await supabase
      .from("horse_listings")
      .select("status")
      .eq("id", options.excludeListingId)
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.status === "active") {
      activeListings = Math.max(activeListings - 1, 0);
    }
  }

  const usage = buildUsageSnapshot(activeListings, snapshot.features.maxActiveListings);

  if (usage.atLimit) {
    return {
      ok: false,
      error: "You have reached your active listing limit for your current plan.",
      errorCode: LISTING_QUOTA_ERROR_CODE,
      quota: usage,
    };
  }

  return { ok: true };
}

export function mapBillingHistoryRow(row: Record<string, unknown>): BillingHistoryRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    subscription_id: row.subscription_id ? String(row.subscription_id) : null,
    stripe_invoice_id: row.stripe_invoice_id ? String(row.stripe_invoice_id) : null,
    amount_cents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? "eur"),
    status: row.status as BillingHistoryRow["status"],
    invoice_pdf_url: row.invoice_pdf_url ? String(row.invoice_pdf_url) : null,
    hosted_invoice_url: row.hosted_invoice_url ? String(row.hosted_invoice_url) : null,
    period_start: row.period_start ? String(row.period_start) : null,
    period_end: row.period_end ? String(row.period_end) : null,
    created_at: String(row.created_at),
  };
}

export async function getAllPlans(supabase: SupabaseClient): Promise<PlanRow[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapPlanRow(row as Record<string, unknown>));
}

export { mapPlanRow, mapSubscriptionRow };
