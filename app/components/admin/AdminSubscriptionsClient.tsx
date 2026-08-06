"use client";

import { useLocale, useTranslations } from "next-intl";
import type { AdminSubscriptionListItem, AdminSubscriptionStats, PlanRow } from "@/app/types/subscription";
import {
  ADMIN_ERROR_CLASS,
  ADMIN_TABLE_CLASS,
} from "@/app/components/admin/admin-styles";

type Props = {
  stats: AdminSubscriptionStats;
  subscriptions: AdminSubscriptionListItem[];
  plans: PlanRow[];
  error?: string;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function AdminSubscriptionsClient({ stats, subscriptions, plans, error }: Props) {
  const t = useTranslations("subscription.admin");
  const locale = useLocale();

  function formatDate(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      {error ? <div className={ADMIN_ERROR_CLASS}>{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("mrr")} value={formatMoney(stats.monthlyRecurringRevenueCents)} />
        <StatCard label={t("totalRevenue")} value={formatMoney(stats.totalRevenueCents)} />
        <StatCard label={t("paidSubscriptions")} value={String(stats.activePaidSubscriptions)} />
        <StatCard label={t("paidInvoices")} value={String(stats.paidInvoices)} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={t("freeUsers")} value={String(stats.freeUsers)} />
        <StatCard label={t("proUsers")} value={String(stats.proUsers)} />
        <StatCard label={t("enterpriseUsers")} value={String(stats.enterpriseUsers)} />
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <h2 className="text-xl font-bold text-white">{t("plans")}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-2xl border border-white/10 bg-[#0f1729] p-4">
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
              <p className="mt-3 text-sm text-gray-300">
                {plan.max_active_listings == null
                  ? "Unlimited listings"
                  : `${plan.max_active_listings} active listings`}
              </p>
              <p className="mt-1 text-sm text-gray-300">
                {formatMoney(plan.monthly_price_cents)} / month
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-x-auto rounded-3xl border border-white/10 bg-[#111827]">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-bold text-white">{t("customers")}</h2>
        </div>
        {subscriptions.length === 0 ? (
          <p className="px-6 py-12 text-center text-gray-500">{t("noCustomers")}</p>
        ) : (
          <table className={ADMIN_TABLE_CLASS}>
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Usage</th>
                <th className="px-4 py-3 text-left">Period end</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((item) => (
                <tr key={item.userId} className="border-t border-white/5">
                  <td className="px-4 py-3 font-mono text-sm">{item.userReference}</td>
                  <td className="px-4 py-3">{item.planName}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">
                    {t("listingUsage", { count: item.activeListings })}
                  </td>
                  <td className="px-4 py-3">{formatDate(item.currentPeriodEnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#111827] p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
