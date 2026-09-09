import type Stripe from "stripe";
import { createServiceClient } from "@/app/lib/supabase/service";
import {
  HORSE_LISTING_AGB_VERSION,
  HORSE_LISTING_RULES_VERSION,
} from "@/app/lib/marketplace/horse-listing-billing-constants";

function getOrderId(session: Stripe.Checkout.Session): string | null {
  return session.metadata?.horse_listing_order_id ?? null;
}

export async function handleHorseListingWebhookEvent(event: Stripe.Event) {
  const supabase = createServiceClient();

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id ?? null;

    if (!paymentIntentId) return;

    const { data: order, error: orderError } = await supabase
      .from("horse_listing_orders")
      .select("id, listing_id, status")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .maybeSingle();

    if (orderError) throw new Error(orderError.message);
    if (!order) return;
    if (order.status === "refunded") return;

    const refundedAt = new Date().toISOString();
    const { data: refundedOrder, error: updateOrderError } = await supabase
      .from("horse_listing_orders")
      .update({ status: "refunded", refunded_at: refundedAt })
      .eq("id", order.id)
      .eq("status", "paid")
      .select("id")
      .maybeSingle();

    if (updateOrderError) throw new Error(updateOrderError.message);
    if (!refundedOrder) return;

    // A refunded listing payment must not remain publicly active.
    const { error: listingError } = await supabase
      .from("horse_listings")
      .update({ status: "paused", listing_expires_at: null, published_at: null })
      .eq("id", order.listing_id)
      .eq("status", "active");

    if (listingError) throw new Error(listingError.message);
    return;
  }

  if (!event.type.startsWith("checkout.session.")) return;

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "payment") return;

  const orderId = getOrderId(session);
  if (!orderId) return;

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (session.payment_status !== "paid") return;

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const { data: order, error: orderError } = await supabase
      .from("horse_listing_orders")
      .select("id, listing_id, buyer_user_id, plan_slug, plan_name, visibility_level, duration_days, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error(orderError?.message || "Horse listing billing order not found.");
    }

    if (order.status === "refunded" || order.status === "cancelled") return;

    const paidAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + Number(order.duration_days) * 86400000).toISOString();

    const { error: updateOrderError } = await supabase
      .from("horse_listing_orders")
      .update({
        status: "paid",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        payment_reference: paymentIntentId ?? session.id,
        paid_at: paidAt,
        expires_at: expiresAt,
        agb_version: HORSE_LISTING_AGB_VERSION,
        marketplace_rules_version: HORSE_LISTING_RULES_VERSION,
      })
      .eq("id", order.id);

    if (updateOrderError) throw new Error(updateOrderError.message);

    // Payment unlocks the listing for moderation. It does not bypass moderation.
    const { error: listingError } = await supabase
      .from("horse_listings")
      .update({
        listing_package_slug: order.plan_slug,
        listing_visibility: order.visibility_level,
        listing_expires_at: expiresAt,
        status: "pending",
        published_at: null,
      })
      .eq("id", order.listing_id)
      .eq("user_id", order.buyer_user_id);

    if (listingError) throw new Error(listingError.message);
    return;
  }

  if (event.type === "checkout.session.async_payment_failed") {
    await supabase
      .from("horse_listing_orders")
      .update({
        status: "failed",
        stripe_checkout_session_id: session.id,
      })
      .eq("id", orderId)
      .neq("status", "paid");
    return;
  }

  if (event.type === "checkout.session.expired") {
    await supabase
      .from("horse_listing_orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        stripe_checkout_session_id: session.id,
      })
      .eq("id", orderId)
      .neq("status", "paid");
  }
}
