import type Stripe from "stripe";
import { createServiceClient } from "@/app/lib/supabase/service";
import {
  mapStripeInvoiceStatus,
  mapStripeSubscriptionStatus,
  planSlugFromStripePriceId,
} from "@/app/lib/stripe/config";
import type { BillingInterval, PlanSlug } from "@/app/types/subscription";

async function getPlanIdBySlug(slug: PlanSlug) {
  const supabase = createServiceClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseHost = (() => {
    try {
      return new URL(supabaseUrl).host;
    } catch {
      return "invalid-url";
    }
  })();

  const { data, error } = await supabase
    .from("plans")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[stripe-webhook] Supabase plans query failed:", {
      slug,
      host: supabaseHost,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Supabase plans query failed for slug ${slug}: ${error.message}`);
  }

  if (!data) {
    const { data: visiblePlans, error: listError } = await supabase
      .from("plans")
      .select("id, slug")
      .order("slug");

    console.error("[stripe-webhook] Plan missing from Supabase:", {
      requestedSlug: slug,
      host: supabaseHost,
      visibleSlugs: visiblePlans?.map((plan) => plan.slug) ?? [],
      listError: listError
        ? {
            code: listError.code,
            message: listError.message,
            details: listError.details,
            hint: listError.hint,
          }
        : null,
    });

    throw new Error(
      `Plan not found for slug: ${slug} (Supabase host: ${supabaseHost}; visible plans: ${
        visiblePlans?.map((plan) => plan.slug).join(", ") || "none"
      })`
    );
  }

  return String(data.id);
}

async function getFreePlanId() {
  return getPlanIdBySlug("free");
}

async function recordSubscriptionEvent(input: {
  subscriptionId?: string | null;
  userId?: string | null;
  eventType: string;
  stripeEventId?: string | null;
  previousPlanSlug?: string | null;
  newPlanSlug?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  await supabase.from("subscription_events").insert({
    subscription_id: input.subscriptionId ?? null,
    user_id: input.userId ?? null,
    event_type: input.eventType,
    stripe_event_id: input.stripeEventId ?? null,
    previous_plan_slug: input.previousPlanSlug ?? null,
    new_plan_slug: input.newPlanSlug ?? null,
    metadata: input.metadata ?? {},
  });
}

async function resolveUserIdFromStripeSubscription(
  subscription: Stripe.Subscription
): Promise<string | null> {
  const metadataUserId = subscription.metadata?.user_id;
  if (metadataUserId) {
    return metadataUserId;
  }

  const supabase = createServiceClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { data } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.user_id ? String(data.user_id) : null;
}

async function syncStripeSubscription(
  stripeSubscription: Stripe.Subscription,
  eventType: string,
  stripeEventId: string
) {
  const supabase = createServiceClient();
  const userId = await resolveUserIdFromStripeSubscription(stripeSubscription);

  if (!userId) {
    throw new Error("Unable to resolve user for Stripe subscription.");
  }

  await supabase.rpc("ensure_user_subscription", { p_user_id: userId });

  const priceId = stripeSubscription.items.data[0]?.price?.id ?? null;
  const planSlug =
    (stripeSubscription.metadata?.plan_slug as PlanSlug | undefined) ||
    planSlugFromStripePriceId(priceId) ||
    "free";
  const billingInterval =
    stripeSubscription.items.data[0]?.price?.recurring?.interval === "year"
      ? ("year" as BillingInterval)
      : ("month" as BillingInterval);

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, plan_id, plans(slug)")
    .eq("user_id", userId)
    .maybeSingle();

  const previousPlanSlug =
    (existing?.plans as { slug?: string } | null)?.slug ?? "free";
  const planId =
    stripeSubscription.status === "canceled"
      ? await getFreePlanId()
      : await getPlanIdBySlug(planSlug);

  const customerId =
    typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

  // Stripe API 2025-03-31+ moved current period timestamps from the
  // top-level Subscription object to Subscription Items.
  const subscriptionItem = stripeSubscription.items.data[0];
  const currentPeriodStart = subscriptionItem?.current_period_start ?? null;
  const currentPeriodEnd = subscriptionItem?.current_period_end ?? null;

  const patch = {
    plan_id: planId,
    status: mapStripeSubscriptionStatus(stripeSubscription.status),
    billing_interval: billingInterval,
    stripe_customer_id: customerId,
    stripe_subscription_id: stripeSubscription.id,
    current_period_start: currentPeriodStart
      ? new Date(currentPeriodStart * 1000).toISOString()
      : null,
    current_period_end: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null,
    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    canceled_at: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
      : null,
    trial_end: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000).toISOString()
      : null,
  };

  const { data: updated, error } = await supabase
    .from("subscriptions")
    .update(patch)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  await recordSubscriptionEvent({
    subscriptionId: updated?.id ? String(updated.id) : existing?.id ? String(existing.id) : null,
    userId,
    eventType,
    stripeEventId,
    previousPlanSlug,
    newPlanSlug: stripeSubscription.status === "canceled" ? "free" : planSlug,
    metadata: {
      stripe_subscription_id: stripeSubscription.id,
      stripe_status: stripeSubscription.status,
    },
  });
}

async function syncStripeInvoice(invoice: Stripe.Invoice, stripeEventId: string) {
  const supabase = createServiceClient();
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!customerId) {
    return;
  }

  const { data: subscriptionRow } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!subscriptionRow?.user_id) {
    return;
  }

  await supabase.from("billing_history").upsert(
    {
      user_id: subscriptionRow.user_id,
      subscription_id: subscriptionRow.id,
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_paid ?? invoice.amount_due ?? 0,
      currency: invoice.currency ?? "eur",
      status: mapStripeInvoiceStatus(invoice.status),
      invoice_pdf_url: invoice.invoice_pdf ?? null,
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
    },
    { onConflict: "stripe_invoice_id" }
  );

  await recordSubscriptionEvent({
    subscriptionId: String(subscriptionRow.id),
    userId: String(subscriptionRow.user_id),
    eventType: "invoice_synced",
    stripeEventId,
    metadata: {
      stripe_invoice_id: invoice.id,
      status: invoice.status,
      amount_paid: invoice.amount_paid,
    },
  });
}

async function recordAdvertisementBillingEvent(
  event: Stripe.Event,
  orderId: string | null
): Promise<boolean> {
  const supabase = createServiceClient();
  const payload = event.data.object as unknown as Record<string, unknown>;

  const { error } = await supabase
    .from("advertisement_billing_events")
    .upsert(
      {
        order_id: orderId,
        event_type: event.type,
        provider: "stripe",
        provider_event_id: event.id,
        payload,
      },
      { onConflict: "provider_event_id", ignoreDuplicates: true }
    );

  if (error) {
    throw new Error(`Unable to record advertising billing event: ${error.message}`);
  }

  const { data: existing } = await supabase
    .from("advertisement_billing_events")
    .select("processed_at")
    .eq("provider_event_id", event.id)
    .maybeSingle();

  return Boolean(existing?.processed_at);
}

async function markAdvertisementOrderProcessed(orderId: string, eventId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("advertisement_billing_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider_event_id", eventId)
    .eq("order_id", orderId);

  if (error) {
    throw new Error(`Unable to mark advertising billing event processed: ${error.message}`);
  }
}

async function findAdvertisementOrderId(session: Stripe.Checkout.Session): Promise<string | null> {
  const metadataOrderId = session.metadata?.billing_order_id;
  if (metadataOrderId) {
    return metadataOrderId;
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("advertisement_billing_orders")
    .select("id")
    .eq("payment_session_id", session.id)
    .maybeSingle();

  return data?.id ? String(data.id) : null;
}

async function syncAdvertisementCheckoutSession(
  session: Stripe.Checkout.Session,
  event: Stripe.Event
) {
  const orderId = await findAdvertisementOrderId(session);
  const alreadyProcessed = await recordAdvertisementBillingEvent(event, orderId);
  if (alreadyProcessed) return;

  if (!orderId) {
    throw new Error("Advertising billing order not found for Stripe Checkout Session.");
  }

  const supabase = createServiceClient();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const isPaid = session.payment_status === "paid";
  const nextStatus = isPaid ? "paid" : "pending_payment";

  const { data: order, error: orderError } = await supabase
    .from("advertisement_billing_orders")
    .select("id, advertisement_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new Error(orderError?.message || "Advertising billing order not found.");
  }

  const { error: updateError } = await supabase
    .from("advertisement_billing_orders")
    .update({
      status: nextStatus,
      payment_provider: "stripe",
      payment_session_id: session.id,
      payment_intent_id: paymentIntentId,
      payment_reference: paymentIntentId ?? session.id,
      paid_at: isPaid ? new Date().toISOString() : null,
    })
    .eq("id", order.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await supabase
    .from("advertisements")
    .update({ billing_status: isPaid ? "paid" : "pending_payment" })
    .eq("id", order.advertisement_id);

  if (isPaid) {
    // Payment never bypasses moderation. An already-approved campaign can remain active;
    // draft/pending/rejected campaigns keep their current moderation state until approved.
    const { data: advertisement } = await supabase
      .from("advertisements")
      .select("status")
      .eq("id", order.advertisement_id)
      .maybeSingle();

    if (advertisement?.status === "active") {
      await supabase
        .from("advertisements")
        .update({ billing_status: "paid", payment_reference: paymentIntentId ?? session.id })
        .eq("id", order.advertisement_id);
    }
  }

  await markAdvertisementOrderProcessed(order.id, event.id);
}

async function syncAdvertisementCheckoutFailure(
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
  status: "failed" | "cancelled"
) {
  const orderId = await findAdvertisementOrderId(session);
  const alreadyProcessed = await recordAdvertisementBillingEvent(event, orderId);
  if (alreadyProcessed) return;

  if (!orderId) {
    throw new Error("Advertising billing order not found for Stripe Checkout Session.");
  }

  const supabase = createServiceClient();
  const { data: order, error: orderError } = await supabase
    .from("advertisement_billing_orders")
    .select("id, advertisement_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new Error(orderError?.message || "Advertising billing order not found.");
  }

  await supabase
    .from("advertisement_billing_orders")
    .update({ status })
    .eq("id", order.id);

  await supabase
    .from("advertisements")
    .update({ billing_status: status })
    .eq("id", order.advertisement_id);

  await markAdvertisementOrderProcessed(order.id, event.id);
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const stripe = (await import("@/app/lib/stripe/config")).getStripeClient();
        const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
        await syncStripeSubscription(subscription, event.type, event.id);
        return;
      }

      if (session.mode === "payment" && session.metadata?.billing_order_id) {
        await syncAdvertisementCheckoutSession(session, event);
      }
      return;
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment" && session.metadata?.billing_order_id) {
        await syncAdvertisementCheckoutSession(session, event);
      }
      return;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment" && session.metadata?.billing_order_id) {
        await syncAdvertisementCheckoutFailure(session, event, "failed");
      }
      return;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment" && session.metadata?.billing_order_id) {
        await syncAdvertisementCheckoutFailure(session, event, "cancelled");
      }
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncStripeSubscription(subscription, event.type, event.id);
      return;
    }
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.finalized": {
      const invoice = event.data.object as Stripe.Invoice;
      await syncStripeInvoice(invoice, event.id);
      return;
    }
    default:
      return;
  }
}
