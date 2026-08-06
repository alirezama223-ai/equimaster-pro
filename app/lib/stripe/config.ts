import Stripe from "stripe";
import type { BillingInterval, PlanSlug } from "@/app/types/subscription";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return new Stripe(secretKey);
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return secret;
}

export function resolveStripePriceEnvKey(planSlug: PlanSlug, interval: BillingInterval): string {
  return `STRIPE_PRICE_${planSlug.toUpperCase()}_${interval === "month" ? "MONTHLY" : "YEARLY"}`;
}

export function getStripePriceId(planSlug: PlanSlug, interval: BillingInterval): string | null {
  if (planSlug === "free") {
    return null;
  }

  const envKey = resolveStripePriceEnvKey(planSlug, interval);
  return process.env[envKey]?.trim() || null;
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim()?.replace(/^/, "https://") ||
    "http://localhost:3000"
  );
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): import("@/app/types/subscription").SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "paused":
      return "paused";
    default:
      return "incomplete";
  }
}

export function mapStripeInvoiceStatus(
  status: Stripe.Invoice.Status | null | undefined
): import("@/app/types/subscription").InvoiceStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "open":
      return "open";
    case "paid":
      return "paid";
    case "void":
      return "void";
    case "uncollectible":
      return "uncollectible";
    default:
      return "open";
  }
}

export function planSlugFromStripePriceId(priceId: string | null | undefined): PlanSlug | null {
  if (!priceId) return null;

  const pairs: Array<[PlanSlug, BillingInterval]> = [
    ["pro", "month"],
    ["pro", "year"],
    ["enterprise", "month"],
    ["enterprise", "year"],
  ];

  for (const [slug, interval] of pairs) {
    if (getStripePriceId(slug, interval) === priceId) {
      return slug;
    }
  }

  return null;
}
