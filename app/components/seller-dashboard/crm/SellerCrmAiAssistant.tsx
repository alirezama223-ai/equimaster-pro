"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import SellerDashboardEmptyState from "@/app/components/seller-dashboard/SellerDashboardEmptyState";
import type { CrmAiRecommendation } from "@/app/components/seller-dashboard/crm/seller-crm-types";

type Props = {
  recommendations: CrmAiRecommendation[];
};

function SellerCrmAiAssistant({ recommendations }: Props) {
  const t = useTranslations("dashboard");

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
              {t("crm.ai.eyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {t("crm.ai.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100/70">
              {t("crm.ai.description")}
            </p>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="mt-6">
            <SellerDashboardEmptyState
              title={t("crm.ai.emptyTitle")}
              message={t("crm.ai.emptyMessage")}
              icon="✦"
            />
          </div>
        ) : (
          <>
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
                    <p className="text-sm leading-relaxed text-white">
                      {t(`crm.ai.recommendations.${item.id}`)}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-blue-300/70">
                      {item.impact === "high" ? t("crm.ai.impactHigh") : t("crm.ai.impactMedium")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] transition hover:bg-blue-500"
            >
              {t("crm.ai.viewAll")}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default memo(SellerCrmAiAssistant);
