import type { AdvertisementBillingOrder } from "@/app/actions/advertisementBilling";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_payment: "Pending payment",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default function AdvertisementBillingManager({ initialOrders }: { initialOrders: AdvertisementBillingOrder[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
      <div>
        <h2 className="text-xl font-bold text-white">Advertising billing</h2>
        <p className="mt-1 text-sm text-gray-400">
          Order lifecycle is prepared for payment-provider integration. Payment collection remains disabled.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          ["Pending", initialOrders.filter((order) => order.status === "pending_payment").length],
          ["Paid", initialOrders.filter((order) => order.status === "paid").length],
          ["Total orders", initialOrders.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[#081223] p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {initialOrders.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">
          No advertising orders yet. Orders will appear here after customer billing is enabled.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#081223] text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {initialOrders.map((order) => (
                <tr key={order.id} className="border-t border-white/10 text-gray-300">
                  <td className="px-4 py-3 font-medium text-white">{order.plan_name}</td>
                  <td className="px-4 py-3">{order.placement}</td>
                  <td className="px-4 py-3">{order.duration_days} days</td>
                  <td className="px-4 py-3">{Number(order.amount).toFixed(2)} {order.currency}</td>
                  <td className="px-4 py-3">{statusLabels[order.status] ?? order.status}</td>
                  <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-600">
        Payment collection, invoices, tax calculation, refunds, and provider webhooks stay disabled until the commercial setup is finalized.
      </p>
    </section>
  );
}
