"use client";

import { memo } from "react";
import type { CrmAiRecommendation } from "@/app/components/seller-dashboard/crm/seller-crm-types";

type Props = {
  recommendations: CrmAiRecommendation[];
};

function SellerCrmAiAssistant({ recommendations }: Props) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-blue-500/30 bg-gradient-to-br from-[#0f1f3d] via-[#0a1628] to-[#081223] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/15 text-2xl shadow-[0_0_30px_rgba(59,130,246,0.35)]"
          >
            ✦
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
              AI Assistant
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              EquiMaster AI
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100/70">
              Personalized recommendations to help you close deals faster and present listings with
              maximum impact.
            </p>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {recommendations.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-2xl border border-blue-500/15 bg-blue-500/5 px-4 py-3 backdrop-blur-sm"
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  item.impact === "high"
                    ? "bg-blue-500/20 text-blue-200"
                    : "bg-white/5 text-gray-300"
                }`}
              >
                →
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-relaxed text-white">{item.label}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-blue-300/70">
                  {item.impact} impact
                </p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] transition hover:bg-blue-500"
        >
          View all recommendations
        </button>
      </div>
    </section>
  );
}

export default memo(SellerCrmAiAssistant);
