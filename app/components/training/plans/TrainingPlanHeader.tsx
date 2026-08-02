"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trainingPlanStatusClassName } from "@/app/lib/training/plans/format";
import type { TrainingPlanEditorData } from "@/app/lib/training/plans/editor-types";
import type { TrainingPlanStatus } from "@/app/types/training-plans";

type Props = {
  plan: TrainingPlanEditorData;
  statusUpdating?: boolean;
  statusError?: string | null;
  onStatusChange?: (status: TrainingPlanStatus) => void;
};

const PLAN_STATUSES: TrainingPlanStatus[] = ["draft", "active", "completed", "archived"];

export default function TrainingPlanHeader({
  plan,
  statusUpdating = false,
  statusError = null,
  onStatusChange,
}: Props) {
  const t = useTranslations("training");

  function planStatusLabel(status: TrainingPlanStatus): string {
    return t(`planStatus.${status}` as Parameters<typeof t>[0]);
  }

  return (
    <header className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("plans.editorEyebrow")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-white sm:text-4xl">{plan.name}</h1>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${trainingPlanStatusClassName(plan.status)}`}
            >
              {planStatusLabel(plan.status)}
            </span>
          </div>
          {plan.description ? (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">{plan.description}</p>
          ) : null}
        </div>

        <Link
          href="/training/plans"
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white"
        >
          {t("plans.backToPlansShort")}
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
        <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("plans.duration")}</p>
          <p className="mt-2 text-sm font-semibold text-white">{plan.durationLabel}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("plans.weeks")}</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {t("plans.weekCount", { count: plan.weekCount })}
          </p>
        </div>
        {onStatusChange ? (
          <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4 sm:col-span-2 lg:col-span-1">
            <label className="block">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("plans.planStatus")}</p>
              <select
                value={plan.status}
                disabled={statusUpdating}
                onChange={(event) => onStatusChange(event.target.value as TrainingPlanStatus)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#081223] px-3 py-2 text-sm font-semibold text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              >
                {PLAN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {planStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            {statusError ? <p className="mt-2 text-xs text-red-200">{statusError}</p> : null}
            <p className="mt-2 text-xs text-gray-500">{t("plans.planStatusHint")}</p>
          </div>
        ) : null}
      </div>
    </header>
  );
}
