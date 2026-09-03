"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import {
  getAllPlans,
  getUserSubscriptionSnapshot,
  mapBillingHistoryRow,
} from "@/app/lib/subscriptions/queries";
import {
  getSiteUrl,
  getStripeClient,
  getStripePriceId,
  isStripeConfigured,
} from "@/app/lib/stripe/config";
import type {
  BillingHistoryRow,
  BillingInterval,
  PlanRow,
  PlanSlug,
  SubscriptionSnapshot,
} from "@/app/types/subscription";

const REVALIDATE_PATHS = [
  "/account",
  "/account/subscription",
  "/sell",
  "/dashboard/seller",
  "/admin/subscriptions",
];

function revalidateSubscriptionPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in.", user: null, supabase: null };
  }

  return { error: null, user, supabase };
}

export async function getSubscriptionSnapshot(): Promise<{
  snapshot: SubscriptionSnapshot | null;
  plans: PlanRow[];
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { snapshot: null, plans: [], error: auth.error ?? "Forbidden" };
  }

  try {
    const [snapshot, plans] = await Promise.all([
      getUserSubscriptionSnapshot(auth.supabase, auth.user.id),
      getAllPlans(auth.supabase),
    ]);

    return { snapshot, plans };
  } catch (error) {
    return {
      snapshot: null,
      plans: [],
      error: error instanceof Error ? error.message : "Unable to load subscription.",
    };
  }
}

export async function getBillingHistory(limit = 12): Promise<{
  invoices: BillingHistoryRow[];
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { invoices: [], error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("billing_history")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { invoices: [], error: error.message };
  }

  return {
    invoices: (data ?? []).map((row) => mapBillingHistoryRow(row as Record<string, unknown>)),
  };
}

async function getOrCreateStripeCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined
): Promise<string> {
  const snapshot = await getUserSubscriptionSnapshot(supabase, userId);
  if (snapshot?.subscription.stripe_customer_id) {
    return snapshot.subscription.stripe_customer_id;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { user_id: userId },
  });

  await supabase
    .from("subscriptions")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", userId);

  return customer.id;
}

export async function createSubscriptionCheckoutSession(
  planSlug: PlanSlug,
  interval: BillingInterval
): Promise<{ url: string } | { success: true } | { error: string }> {
  if (!isStripeConfigured()) {
    return { error: "Stripe billing is not configured yet." };
  }

  if (planSlug === "free") {
    return { error: "The Free plan does not require checkout." };
  }

  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const priceId = getStripePriceId(planSlug, interval);
  if (!priceId) {
    return { error: "This plan is not available for checkout yet." };
  }

  try {
    const snapshot = await getUserSubscriptionSnapshot(auth.supabase, auth.user.id);
    const existingSubscriptionId = snapshot?.subscription.stripe_subscription_id;
    const existingPlan = snapshot?.plan.slug;
    const existingInterval = snapshot?.subscription.billing_interval;

    if (snapshot?.isPaid && existingSubscriptionId) {
      if (existingPlan === planSlug && existingInterval === interval) {
        return { success: true };
      }

      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(existingSubscriptionId);
      const item = subscription.items.data[0];

      if (!item) {
        return { error: "No subscription item found for the active subscription." };
      }

      await stripe.subscriptions.update(existingSubscriptionId, {
        items: [{ id: item.id, price: priceId, quantity: item.quantity ?? 1 }],
        proration_behavior: "always_invoice",
        payment_behavior: "pending_if_incomplete",
        metadata: {
          ...subscription.metadata,
          user_id: auth.user.id,
          plan_slug: planSlug,
          billing_interval: interval,
        },
      });

      revalidateSubscriptionPaths();
      return { success: true };
    }

    const customerId = await getOrCreateStripeCustomer(
      auth.supabase,
      auth.user.id,
      auth.user.email ?? undefined
    );
    const stripe = getStripeClient();
    const siteUrl = getSiteUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/account/subscription?checkout=success`,
      cancel_url: `${siteUrl}/account/subscription?checkout=canceled`,
      client_reference_id: auth.user.id,
      metadata: {
        user_id: auth.user.id,
        plan_slug: planSlug,
        billing_interval: interval,
      },
      subscription_data: {
        metadata: {
          user_id: auth.user.id,
          plan_slug: planSlug,
          billing_interval: interval,
        },
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return { error: "Unable to start checkout session." };
    }

    return { url: session.url };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to start checkout.",
    };
  }
}

export async function createBillingPortalSession(): Promise<{ url: string } | { error: string }> {
  if (!isStripeConfigured()) {
    return { error: "Stripe billing is not configured yet." };
  }

  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const snapshot = await getUserSubscriptionSnapshot(auth.supabase, auth.user.id);
  if (!snapshot?.subscription.stripe_customer_id) {
    return { error: "No billing account found for this user." };
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: snapshot.subscription.stripe_customer_id,
      return_url: `${getSiteUrl()}/account/subscription`,
    });

    return { url: session.url };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to open billing portal.",
    };
  }
}

export async function cancelSubscriptionAtPeriodEnd(): Promise<
  { success: true } | { error: string }
> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const snapshot = await getUserSubscriptionSnapshot(auth.supabase, auth.user.id);
  if (!snapshot?.subscription.stripe_subscription_id) {
    return { error: "No active paid subscription to cancel." };
  }

  if (!isStripeConfigured()) {
    return { error: "Stripe billing is not configured yet." };
  }

  try {
    const stripe = getStripeClient();
    await stripe.subscriptions.update(snapshot.subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await auth.supabase
      .from("subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("user_id", auth.user.id);

    revalidateSubscriptionPaths();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to cancel subscription.",
    };
  }
}

export async function resumeSubscription(): Promise<{ success: true } | { error: string }> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const snapshot = await getUserSubscriptionSnapshot(auth.supabase, auth.user.id);
  if (!snapshot?.subscription.stripe_subscription_id) {
    return { error: "No paid subscription to resume." };
  }

  if (!isStripeConfigured()) {
    return { error: "Stripe billing is not configured yet." };
  }

  try {
    const stripe = getStripeClient();
    await stripe.subscriptions.update(snapshot.subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    await auth.supabase
      .from("subscriptions")
      .update({ cancel_at_period_end: false, canceled_at: null })
      .eq("user_id", auth.user.id);

    revalidateSubscriptionPaths();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to resume subscription.",
    };
  }
}

export async function redirectToCheckout(planSlug: PlanSlug, interval: BillingInterval) {
  const result = await createSubscriptionCheckoutSession(planSlug, interval);
  if ("error" in result) {
    redirect(`/account/subscription?error=${encodeURIComponent(result.error)}`);
  }
  if ("url" in result) {
    redirect(result.url);
  }
  redirect(`/account/subscription`);
}

export async function redirectToBillingPortal() {
  const result = await createBillingPortalSession();
  if ("error" in result) {
    redirect(`/account/subscription?error=${encodeURIComponent(result.error)}`);
  }
  redirect(result.url);
}

export async function getPublicPlans(): Promise<{ plans: PlanRow[]; error?: string }> {
  const supabase = await createClient();
  try {
    const plans = await getAllPlans(supabase);
    return { plans };
  } catch (error) {
    return {
      plans: [],
      error: error instanceof Error ? error.message : "Unable to load plans.",
    };
  }
}

export async function getListingQuotaSnapshot(): Promise<{
  snapshot: SubscriptionSnapshot | null;
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { snapshot: null, error: auth.error ?? "Forbidden" };
  }

  try {
    const snapshot = await getUserSubscriptionSnapshot(auth.supabase, auth.user.id);
    return { snapshot };
  } catch (error) {
    return {
      snapshot: null,
      error: error instanceof Error ? error.message : "Unable to load quota.",
    };
  }
}
