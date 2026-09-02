import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { getStripeClient, getSiteUrl, isStripeConfigured } from "@/app/lib/stripe/config";

export const runtime = "nodejs";

function toStripeUnitAmount(amount: number): number {
  const unitAmount = Math.round(amount * 100);
  if (!Number.isFinite(unitAmount) || unitAmount < 0) {
    throw new Error("Invalid advertising order amount.");
  }
  return unitAmount;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: { orderId?: string };
  try {
    body = (await request.json()) as { orderId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabase
    .from("advertisement_billing_orders")
    .select(
      "id, advertisement_id, buyer_user_id, plan_name, placement, duration_days, amount, currency, status, metadata"
    )
    .eq("id", orderId)
    .eq("buyer_user_id", user.id)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Advertising order not found." }, { status: 404 });
  }

  if (!["draft", "pending_payment"].includes(order.status)) {
    return NextResponse.json(
      { error: `Order cannot be paid in its current status: ${order.status}.` },
      { status: 409 }
    );
  }

  if (Number(order.amount) <= 0) {
    return NextResponse.json({ error: "A positive order amount is required for Stripe Checkout." }, { status: 400 });
  }

  const stripe = getStripeClient();
  const siteUrl = getSiteUrl().replace(/\/$/, "");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: String(order.currency).toLowerCase(),
            product_data: {
              name: `SHABDIZ advertising — ${order.plan_name}`,
              description: `${order.placement} · ${order.duration_days} day${order.duration_days === 1 ? "" : "s"}`,
            },
            unit_amount: toStripeUnitAmount(Number(order.amount)),
          },
          quantity: 1,
        },
      ],
      metadata: {
        billing_order_id: String(order.id),
        advertisement_id: String(order.advertisement_id),
        buyer_user_id: user.id,
      },
      payment_intent_data: {
        metadata: {
          billing_order_id: String(order.id),
          advertisement_id: String(order.advertisement_id),
        },
      },
      success_url: `${siteUrl}/advertising/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/advertising/checkout/cancelled?order_id=${encodeURIComponent(order.id)}`,
    });

    const { error: updateError } = await supabase
      .from("advertisement_billing_orders")
      .update({
        status: "pending_payment",
        payment_provider: "stripe",
        payment_session_id: session.id,
        payment_reference: session.id,
        metadata: {
          ...(order.metadata ?? {}),
          stripe_checkout_session_id: session.id,
        },
      })
      .eq("id", order.id)
      .eq("buyer_user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Stripe Checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
