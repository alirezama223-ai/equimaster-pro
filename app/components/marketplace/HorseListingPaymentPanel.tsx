"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createHorseListingCheckoutSession } from "@/app/actions/horse-listing-billing";

type Plan = {
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

type Props = {
  listingId: string;
  plans: Plan[];
  paidOrder?: {
    plan_slug: string;
    plan_name: string;
    expires_at: string | null;
  } | null;
  paymentStatus?: "success" | "cancelled" | null;
};

export default function HorseListingPaymentPanel({
  listingId,
  plans,
  paidOrder = null,
  paymentStatus = null,
}: Props) {
  const t = useTranslations("listingBilling");
  const locale = useTranslations("common") ? undefined : undefined;
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.slug ?? "");
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCheckout() {
    if (!selectedPlan || !agbAccepted || !rulesAccepted) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createHorseListingCheckoutSession(
        listingId,
        selectedPlan,
        agbAccepted,
        rulesAccepted,
        typeof locale === "string" ? locale : "en"
      );

      if ("error" in result) {
        setError(result.error);
        return;
      }

      window.location.href = result.url;
    } catch {
      setError("Unable to start payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (paidOrder) {
    return (
      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">{t("statusPaid")}</p>
        <h2 className="mt-2 text-2xl font-black text-white">{paidOrder.plan_name}</h2>
        <p className="mt-3 text-gray-300">{t("paymentSuccess")}</p>
        {paidOrder.expires_at ? (
          <p className="mt-2 text-sm text-gray-400">
            {t("duration")}: {new Date(paidOrder.expires_at).toLocaleDateString()}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-2xl sm:p-8">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">SHABDIZ Marketplace</p>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{t("title")}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-400">{t("subtitle")}</p>
      </div>

      {paymentStatus === "success" ? (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {t("paymentSuccess")}
        </div>
      ) : null}
      {paymentStatus === "cancelled" ? (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {t("paymentCancelled")}
        </div>
      ) : null}
      {error ? (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const selected = selectedPlan === plan.slug;
          const isRecommended = plan.slug === "professional";
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.slug)}
              className={`text-left rounded-2xl border p-5 transition ${
                selected
                  ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  {isRecommended ? (
                    <span className="mt-2 inline-flex rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-300">
                      {t("recommended")}
                    </span>
                  ) : null}
                </div>
                <span className="text-2xl font-black text-white">€{plan.price.toFixed(2)}</span>
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-400">
                <p>{t("visibility")}: {plan.visibility_level}</p>
                <p>{t("duration")}: {plan.duration_days} {t("days")}</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={agbAccepted}
            onChange={(event) => setAgbAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
          />
          <span>
            {t("acceptAgb")} {" "}
            <Link href="/legal" className="text-blue-300 underline underline-offset-2 hover:text-blue-200">
              {t("agb")}
            </Link>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={rulesAccepted}
            onChange={(event) => setRulesAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
          />
          <span>
            {t("acceptRules")} {" "}
            <Link href="/legal" className="text-blue-300 underline underline-offset-2 hover:text-blue-200">
              {t("rules")}
            </Link>
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={isSubmitting || !selectedPlan || !agbAccepted || !rulesAccepted}
        className="mt-6 w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? t("processing") : t("payNow")}
      </button>

      <p className="mt-3 text-center text-xs text-gray-500">{t("paymentRequired")}</p>
    </section>
  );
}
