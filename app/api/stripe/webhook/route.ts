import { NextResponse } from "next/server";
import {
  getStripeClient,
  getStripeWebhookSecret,
  isStripeConfigured,
} from "@/app/lib/stripe/config";
import { handleStripeWebhookEvent } from "@/app/lib/stripe/webhook-handlers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    console.error("[stripe-webhook] Stripe is not configured.");
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("[stripe-webhook] Missing Stripe signature.");
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
    console.info("[stripe-webhook] Received event:", event.type, event.id);
    await handleStripeWebhookEvent(event);
    console.info("[stripe-webhook] Processed event successfully:", event.type, event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    console.error("[stripe-webhook] Processing failed:", message, error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
