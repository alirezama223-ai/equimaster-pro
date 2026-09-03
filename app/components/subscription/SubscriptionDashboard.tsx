"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import {
  cancelSubscriptionAtPeriodEnd,
  createBillingPortalSession,
  createSubscriptionCheckoutSession,
  resumeSubscription,
} from "@/app/actions/subscriptions";
import type { BillingHistoryRow, PlanRow, SubscriptionSnapshot } from "@/app/types/subscription";

type Props = {
  snapshot: SubscriptionSnapshot;
  plans: PlanRow[];
  invoices: BillingHistoryRow[];
  checkoutStatus?: string | null;
  errorMessage?: string | null;
};

function formatMoney(cents: number, currency = "EUR") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(value: string | null, locale: string) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function SubscriptionDashboard({
  snapshot,
  plans,
  invoices,
  checkoutStatus,
  errorMessage,
}: Props) {
  const t = useTranslations("subscription");
  const locale = useLocale();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(errorMessage ?? null);
  const [isPending, startTransition] = useTransition();

  const paidPlans = plans.filter((plan) => plan.slug !== "free");

  function handleCheckout(planSlug: "pro" | "enterprise", interval: "month" | "year") {
    setActionError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createSubscriptionCheckoutSession(planSlug, interval);
      if ("error" in result) {
        setActionError(result.error);
        return;
      }
      if ("url" in result) {
        window.location.href = result.url;
        return;
      }
      router.refresh();
    });
  }

  function handlePortal() {
    setActionError(null);
    startTransition(async () => {
      const result = await createBillingPortalSession();
      if ("error" in result) {
        setActionError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  function handleCancel() {
    setActionError(null);
    startTransition(async () => {
      const result = await cancelSubscriptionAtPeriodEnd();
      if ("error" in result) {
        setActionError(result.error);
        return;
      }
      setMessage(t("cancelsOn", { date: formatDate(snapshot.subscription.current_period_end, locale) ?? "" }));
      router.refresh();
    });
  }

  function handleResume() {
    setActionError(null);
    startTransition(async () => {
      const result = await resumeSubscription();
      if ("error" in result) {
        setActionError(result.error);
        return;
      }
      setMessage(t("periodEnd", { date: formatDate(snapshot.subscription.current_period_end, locale) ?? "" }));
      router.refresh();
    });
  }

  const usageLabel =
    snapshot.usage.listingLimit == null
      ? t("unlimitedListings")
      : t("listingQuota", {
          used: snapshot.usage.activeListings,
          limit: snapshot.usage.listingLimit,
        });

  return (
    <div className="space-y-8">
      {checkoutStatus === "success" ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {t("checkoutSuccess")}
        </div>
      ) : null}
      {checkoutStatus === "canceled" ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {t("checkoutCanceled")}
        </div>
      ) : null}
      {(actionError || message) ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            actionError
              ? "border border-red-500/30 bg-red-500/10 text-red-200"
              : "border border-blue-500/30 bg-blue-500/10 text-blue-100"
          }`}
        >
          {actionError ?? message}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">{t("currentPlan")}</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">{snapshot.plan.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              {t(`plans.${snapshot.plan.slug}.description`)}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              {(t.raw(`plans.${snapshot.plan.slug}.features`) as string[]).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-blue-400">
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-4 text-sm text-gray-300">
            <p className="font-semibold text-white">{t("usageTitle")}</p>
            <p className="mt-2">{usageLabel}</p>
            {snapshot.usage.remainingListings != null ? (
              <p className="mt-1 text-gray-400">
                {t("remainingListings", { count: snapshot.usage.remainingListings })}
              </p>
            ) : null}
            {snapshot.subscription.current_period_end ? (
              <p className="mt-3 text-gray-400">
                {snapshot.subscription.cancel_at_period_end
                  ? t("cancelsOn", {
                      date: formatDate(snapshot.subscription.current_period_end, locale) ?? "",
                    })
                  : t("periodEnd", {
                      date: formatDate(snapshot.subscription.current_period_end, locale) ?? "",
                    })}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {snapshot.canManageBilling ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handlePortal}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {t("manageBilling")}
            </button>
          ) : null}
          {snapshot.isPaid && snapshot.subscription.cancel_at_period_end ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleResume}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 disabled:opacity-60"
            >
              {t("resume")}
            </button>
          ) : null}
          {snapshot.isPaid && !snapshot.subscription.cancel_at_period_end ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleCancel}
              className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-200 transition hover:border-red-400/40 disabled:opacity-60"
            >
              {t("cancel")}
            </button>
          ) : null}
        </div>
      </section>

      {snapshot.canUpgrade ? (
        <section className="grid gap-6 lg:grid-cols-2">
          {paidPlans.map((plan) => (
            <article key={plan.id} className="rounded-3xl border border-white/10 bg-[#0f1729] p-6">
              <h2 className="text-2xl font-black text-white">{plan.name}</h2>
              <p className="mt-2 text-sm text-gray-400">{t(`plans.${plan.slug}.description`)}</p>
              <div className="mt-4 space-y-2 text-sm text-gray-300">
                <p>{formatMoney(plan.monthly_price_cents)} / {t("monthly")}</p>
                <p>{formatMoney(plan.yearly_price_cents)} / {t("yearly")}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    isPending ||
                    (snapshot.plan.slug === plan.slug && snapshot.subscription.billing_interval === "month")
                  }
                  onClick={() => handleCheckout(plan.slug as "pro" | "enterprise", "month")}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {t("monthly")}
                </button>
                <button
                  type="button"
                  disabled={
                    isPending ||
                    (snapshot.plan.slug === plan.slug && snapshot.subscription.billing_interval === "year")
                  }
                  onClick={() => handleCheckout(plan.slug as "pro" | "enterprise", "year")}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 disabled:opacity-60"
                >
                  {t("yearly")}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white">{t("invoicesTitle")}</h2>
        {invoices.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">{t("noInvoices")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0f1729] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-white">
                    {formatMoney(invoice.amount_cents, invoice.currency)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatDate(invoice.created_at, locale)} · {invoice.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {invoice.hosted_invoice_url ? (
                    <a
                      href={invoice.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:border-blue-500/40"
                    >
                      {t("viewInvoice")}
                    </a>
                  ) : null}
                  {invoice.invoice_pdf_url ? (
                    <a
                      href={invoice.invoice_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-white/20"
                    >
                      {t("downloadInvoice")}
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
