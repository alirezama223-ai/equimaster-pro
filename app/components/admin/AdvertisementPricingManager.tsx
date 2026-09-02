"use client";

import { useState } from "react";
import {
  createAdvertisementPricingPlan,
  updateAdvertisementPricingPlanStatus,
  type AdvertisementPricingPlan,
} from "@/app/actions/advertisementPricing";

const placements = ["homepage_top", "homepage_featured", "homepage_bottom"];
const currencies = ["EUR", "USD", "GBP"];

export default function AdvertisementPricingManager({ initialPlans }: { initialPlans: AdvertisementPricingPlan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function create(formData: FormData) {
    setBusy(true); setMessage("");
    const result = await createAdvertisementPricingPlan(formData);
    if (result.ok) {
      setMessage("Pricing plan created.");
      window.location.reload();
    } else {
      setMessage(result.error ?? "Unable to create pricing plan.");
    }
    setBusy(false);
  }

  async function toggle(plan: AdvertisementPricingPlan) {
    setBusy(true); setMessage("");
    const fd = new FormData();
    fd.set("id", plan.id);
    fd.set("active", String(!plan.active));
    const result = await updateAdvertisementPricingPlanStatus(fd);
    if (result.ok) setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, active: !item.active } : item));
    else setMessage(result.error ?? "Unable to update pricing plan.");
    setBusy(false);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
      <div>
        <h2 className="text-xl font-bold text-white">Advertising pricing</h2>
        <p className="mt-1 text-sm text-gray-400">Configure commercial prices before enabling customer billing. No prices are pre-seeded.</p>
      </div>

      <form action={create} className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-[#081223] p-4 md:grid-cols-2 xl:grid-cols-5">
        <input name="name" required placeholder="Plan name" className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white" />
        <select name="placement" defaultValue="homepage_featured" className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white">{placements.map((placement) => <option key={placement}>{placement}</option>)}</select>
        <input name="duration_days" required type="number" min="1" max="365" placeholder="Days" className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white" />
        <div className="flex gap-2">
          <input name="price" required type="number" min="0" step="0.01" placeholder="Price" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white" />
          <select name="currency" defaultValue="EUR" className="w-24 rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-white">{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select>
        </div>
        <button disabled={busy} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Add plan"}</button>
      </form>
      {message && <p className="mt-3 text-sm text-amber-300">{message}</p>}

      {plans.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">No pricing plans configured yet. Add the real commercial prices when you are ready.</p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#081223] text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Placement</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
            <tbody>{plans.map((plan) => <tr key={plan.id} className="border-t border-white/10 text-gray-300"><td className="px-4 py-3 font-medium text-white">{plan.name}</td><td className="px-4 py-3">{plan.placement}</td><td className="px-4 py-3">{plan.duration_days} days</td><td className="px-4 py-3">{plan.price.toFixed(2)} {plan.currency}</td><td className="px-4 py-3">{plan.active ? "active" : "inactive"}</td><td className="px-4 py-3 text-right"><button type="button" disabled={busy} onClick={() => toggle(plan)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 disabled:opacity-50">{plan.active ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-600">This stage only stores and manages pricing. Payment collection, invoices, tax handling, refunds, and payment-provider webhooks remain disabled until the commercial setup is finalized.</p>
    </section>
  );
}
