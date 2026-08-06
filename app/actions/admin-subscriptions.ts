"use server";

import { formatOwnerReference, requireAdmin } from "@/app/lib/admin";
import { mapPlanRow } from "@/app/lib/subscriptions/queries";
import type {
  AdminSubscriptionListItem,
  AdminSubscriptionStats,
  PlanRow,
} from "@/app/types/subscription";

export async function getAdminSubscriptionStats(): Promise<{
  stats: AdminSubscriptionStats | null;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { stats: null, error: auth.error ?? "Forbidden" };
  }

  const [
    { count: totalSubscriptions },
    { data: subscriptions },
    { data: billingRows },
    { data: plans },
  ] = await Promise.all([
    auth.supabase.from("subscriptions").select("id", { count: "exact", head: true }),
    auth.supabase.from("subscriptions").select("user_id, status, billing_interval, plan_id, plans(slug)"),
    auth.supabase
      .from("billing_history")
      .select("amount_cents, status")
      .eq("status", "paid"),
    auth.supabase.from("plans").select("*").eq("active", true),
  ]);

  const planRows = (plans ?? []).map((row) => mapPlanRow(row as Record<string, unknown>));
  const planPriceMap = new Map(planRows.map((plan) => [plan.slug, plan]));

  let freeUsers = 0;
  let proUsers = 0;
  let enterpriseUsers = 0;
  let activePaidSubscriptions = 0;
  let monthlyRecurringRevenueCents = 0;

  for (const row of subscriptions ?? []) {
    const slug = (row.plans as { slug?: string } | null)?.slug ?? "free";
    if (slug === "free") freeUsers += 1;
    if (slug === "pro") proUsers += 1;
    if (slug === "enterprise") enterpriseUsers += 1;

    if (row.status === "active" && slug !== "free") {
      activePaidSubscriptions += 1;
      const plan = planPriceMap.get(slug as PlanRow["slug"]);
      if (plan) {
        monthlyRecurringRevenueCents +=
          row.billing_interval === "year"
            ? Math.round(plan.yearly_price_cents / 12)
            : plan.monthly_price_cents;
      }
    }
  }

  const totalRevenueCents = (billingRows ?? []).reduce(
    (sum, row) => sum + Number(row.amount_cents ?? 0),
    0
  );

  return {
    stats: {
      totalSubscriptions: totalSubscriptions ?? 0,
      activePaidSubscriptions,
      freeUsers,
      proUsers,
      enterpriseUsers,
      monthlyRecurringRevenueCents,
      totalRevenueCents,
      paidInvoices: billingRows?.length ?? 0,
    },
  };
}

export async function getAdminSubscriptions(): Promise<{
  subscriptions: AdminSubscriptionListItem[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { subscriptions: [], error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("subscriptions")
    .select(
      "user_id, status, billing_interval, stripe_customer_id, current_period_end, cancel_at_period_end, created_at, plans(slug, name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { subscriptions: [], error: error.message };
  }

  const userIds = (data ?? []).map((row) => String(row.user_id));
  const listingCounts = new Map<string, number>();

  if (userIds.length > 0) {
    const { data: listings } = await auth.supabase
      .from("horse_listings")
      .select("user_id")
      .eq("status", "active")
      .in("user_id", userIds);

    for (const listing of listings ?? []) {
      const userId = String(listing.user_id);
      listingCounts.set(userId, (listingCounts.get(userId) ?? 0) + 1);
    }
  }

  const subscriptions = (data ?? []).map((row) => {
    const plan = row.plans as { slug?: string; name?: string } | null;
    const userId = String(row.user_id);

    return {
      userId,
      userReference: formatOwnerReference(userId),
      planSlug: (plan?.slug ?? "free") as AdminSubscriptionListItem["planSlug"],
      planName: plan?.name ?? "Free",
      status: row.status as AdminSubscriptionListItem["status"],
      billingInterval:
        row.billing_interval === "month" || row.billing_interval === "year"
          ? row.billing_interval
          : null,
      activeListings: listingCounts.get(userId) ?? 0,
      stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
      currentPeriodEnd: row.current_period_end ? String(row.current_period_end) : null,
      cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
      createdAt: String(row.created_at),
    };
  });

  return { subscriptions };
}

export async function getAdminPlans(): Promise<{ plans: PlanRow[]; error?: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { plans: [], error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("plans")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return { plans: [], error: error.message };
  }

  return {
    plans: (data ?? []).map((row) => mapPlanRow(row as Record<string, unknown>)),
  };
}
