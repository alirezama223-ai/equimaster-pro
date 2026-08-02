"use client";

import { useTranslations } from "next-intl";

type Props = {
  dayLabel: string;
};

export default function TrainingPlanRestDay({ dayLabel }: Props) {
  const t = useTranslations("training");

  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#08111F]/60 px-4 py-8 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{dayLabel}</p>
      <p className="mt-3 text-lg font-semibold text-white">{t("plans.restDay")}</p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">{t("plans.restDayDescription")}</p>
    </div>
  );
}
