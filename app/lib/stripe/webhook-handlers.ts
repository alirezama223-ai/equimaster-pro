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
  const { data, error } = await supabase.from("plans").select("id, slug").eq("slug", slug).maybeSingle();
  if (error || !data) {
    throw new Error(`Plan not found for slug: ${slug}`);
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

  const period = stripeSubscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  const patch = {
    plan_id: planId,
    status: mapStripeSubscriptionStatus(stripeSubscription.status),
    billing_interval: billingInterval,
    stripe_customer_id: customerId,
    stripe_subscription_id: stripeSubscription.id,
    current_period_start: period.current_period_start
      ? new Date(period.current_period_start * 1000).toISOString()
      : null,
    current_period_end: period.current_period_end
      ? new Date(period.current_period_end * 1000).toISOString()
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

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) {
        return;
      }

      const stripe = (await import("@/app/lib/stripe/config")).getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
      await syncStripeSubscription(subscription, event.type, event.id);
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
