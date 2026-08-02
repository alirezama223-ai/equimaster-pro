"use client";

import { useTranslations } from "next-intl";
import type { TrainingTodayPlan } from "@/app/types/training";

type Props = {
  plan: TrainingTodayPlan;
};

function PlanDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

export default function TrainingPlanCard({ plan }: Props) {
  const t = useTranslations("training");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-500/30 bg-[#08111F] p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-blue-400">{t("planCard.plan")}</p>
        <p className="mt-2 text-xl font-bold text-white">{plan.planName}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PlanDetail label={t("planCard.week")} value={plan.week} />
        <PlanDetail label={t("planCard.day")} value={plan.day} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("planCard.goal")}</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">{plan.goal}</p>
      </div>
    </div>
  );
}
