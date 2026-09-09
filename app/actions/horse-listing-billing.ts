"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import { createServiceClient } from "@/app/lib/supabase/service";
import {
  getSiteUrl,
  getStripeClient,
  isStripeConfigured,
} from "@/app/lib/stripe/config";
import {
  HORSE_LISTING_AGB_VERSION,
  HORSE_LISTING_RULES_VERSION,
} from "@/app/lib/marketplace/horse-listing-billing-constants";

export { HORSE_LISTING_AGB_VERSION, HORSE_LISTING_RULES_VERSION } from "@/app/lib/marketplace/horse-listing-billing-constants";

type HorseListingPlan = {
  id: string;
  slug: string;
  name: string;
  visibility_level: string;
  duration_days: number;
  price: number;
  currency: string;
  sort_order: number;
  features: string[];
};

export async function getHorseListingPricingPlans(): Promise<{
  plans: HorseListingPlan[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("horse_listing_pricing_plans")
    .select("id, slug, name, visibility_level, duration_days, price, currency, sort_order, features")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return { plans: [], error: "Unable to load listing packages." };
  }

  return {
    plans: (data ?? []).map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      visibility_level: String(row.visibility_level),
      duration_days: Number(row.duration_days),
      price: Number(row.price),
      currency: String(row.currency),
      sort_order: Number(row.sort_order),
      features: Array.isArray(row.features) ? row.features.map(String) : [],
    })),
  };
}

export async function getHorseListingBillingState(listingId: string): Promise<{
  paidOrder: {
    id: string;
    plan_slug: string;
    plan_name: string;
    status: string;
    expires_at: string | null;
    paid_at: string | null;
  } | null;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { paidOrder: null, error: "Not authenticated." };

  const { data: listing, error: listingError } = await supabase
    .from("horse_listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (listingError || !listing) {
    return { paidOrder: null, error: "Listing not found." };
  }

  const service = createServiceClient();
  const { data: order, error } = await service
    .from("horse_listing_orders")
    .select("id, plan_slug, plan_name, status, expires_at, paid_at")
    .eq("listing_id", listingId)
    .eq("buyer_user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { paidOrder: null, error: "Unable to load listing payment status." };

  return {
    paidOrder: order
      ? {
          id: String(order.id),
          plan_slug: String(order.plan_slug),
          plan_name: String(order.plan_name),
          status: String(order.status),
          expires_at: order.expires_at ? String(order.expires_at) : null,
          paid_at: order.paid_at ? String(order.paid_at) : null,
        }
      : null,
  };
}

export async function createHorseListingCheckoutSession(
  listingId: string,
  planSlug: string,
  agbAccepted: boolean,
  marketplaceRulesAccepted: boolean
): Promise<{ url: string } | { error: string }> {
  if (!isStripeConfigured()) {
    return { error: "Stripe billing is not configured yet." };
  }

  if (!agbAccepted || !marketplaceRulesAccepted) {
    return { error: "You must accept the AGB and Marketplace Rules before payment." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const { data: listing, error: listingError } = await supabase
    .from("horse_listings")
    .select("id, name, status, user_id")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (listingError || !listing) return { error: "Listing not found." };

  if (listing.status === "active") {
    return { error: "This listing is already active." };
  }

  const { data: plan, error: planError } = await supabase
    .from("horse_listing_pricing_plans")
    .select("id, slug, name, visibility_level, duration_days, price, currency")
    .eq("slug", planSlug)
    .eq("active", true)
    .maybeSingle();

  if (planError || !plan) return { error: "This listing package is not available." };

  const amount = Number(plan.price);
  const currency = String(plan.currency).toLowerCase();
  const now = new Date().toISOString();
  const service = createServiceClient();

  const { data: order, error: orderError } = await service
    .from("horse_listing_orders")
    .insert({
      listing_id: listingId,
      buyer_user_id: user.id,
      pricing_plan_id: plan.id,
      plan_slug: plan.slug,
      plan_name: plan.name,
      visibility_level: plan.visibility_level,
      duration_days: plan.duration_days,
      amount,
      currency: String(plan.currency).toUpperCase(),
      status: "pending_payment",
      agb_version: HORSE_LISTING_AGB_VERSION,
      marketplace_rules_version: HORSE_LISTING_RULES_VERSION,
      agb_accepted_at: now,
      metadata: {
        listing_name: listing.name,
        source: "horse_listing_checkout",
      },
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[horse-listing-billing] order creation failed", orderError);
    return { error: "Unable to create the listing payment order." };
  }

  try {
    const stripe = getStripeClient();
    const siteUrl = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `SHABDIZ ${plan.name} Horse Listing`,
              description: `${plan.duration_days} days · ${plan.visibility_level}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/dashboard/seller/listings/${listingId}/preview?payment=success`,
      cancel_url: `${siteUrl}/dashboard/seller/listings/${listingId}/preview?payment=cancelled`,
      client_reference_id: user.id,
      metadata: {
        horse_listing_order_id: String(order.id),
        listing_id: listingId,
        user_id: user.id,
        plan_slug: plan.slug,
      },
      payment_intent_data: {
        metadata: {
          horse_listing_order_id: String(order.id),
          listing_id: listingId,
          user_id: user.id,
        },
      },
    });

    await service
      .from("horse_listing_orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    if (!session.url) {
      await service
        .from("horse_listing_orders")
        .update({ status: "failed" })
        .eq("id", order.id);
      return { error: "Unable to start Stripe Checkout." };
    }

    return { url: session.url };
  } catch (error) {
    await service
      .from("horse_listing_orders")
      .update({ status: "failed" })
      .eq("id", order.id);

    console.error("[horse-listing-billing] Stripe checkout creation failed", error);
    return { error: "Unable to start payment. Please try again." };
  }
}

export async function revalidateHorseListingBillingPaths(listingId: string) {
  revalidatePath(`/dashboard/seller/listings/${listingId}/preview`);
  revalidatePath("/dashboard/seller");
  revalidatePath("/sell");
}
