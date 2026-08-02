"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function TrainingDashboardHeader() {
  const t = useTranslations("training");

  return (
    <header className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("dashboard.eyebrow")}</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black text-white">{t("dashboard.title")}</h1>
          <p className="mt-3 max-w-3xl text-gray-400">{t("dashboard.description")}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href="/training/timeline"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white"
          >
            {t("dashboard.navTimeline")}
          </Link>
          <Link
            href="/training/health"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white"
          >
            {t("dashboard.navHealth")}
          </Link>
          <Link
            href="/training/analytics"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white"
          >
            {t("dashboard.navAnalytics")}
          </Link>
          <Link
            href="/training/plans"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white"
          >
            {t("dashboard.navPlans")}
          </Link>
        </div>
      </div>
    </header>
  );
}
