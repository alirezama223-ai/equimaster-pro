"use client";

import { useTranslations } from "next-intl";
import type { TrainingHorse } from "@/app/types/training";
import TrainingEmptyState from "@/app/components/training/TrainingEmptyState";
import TrainingErrorState from "@/app/components/training/TrainingErrorState";

type Props = {
  horses: TrainingHorse[];
  selectedHorseIds: string[];
  loading: boolean;
  error: string | null;
  onToggleHorse: (horseId: string) => void;
};

export default function TrainingPlanAssignedHorses({
  horses,
  selectedHorseIds,
  loading,
  error,
  onToggleHorse,
}: Props) {
  const t = useTranslations("training");
  const selectedSet = new Set(selectedHorseIds);

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{t("plans.assignmentsEyebrow")}</p>
        <h2 className="mt-2 text-xl font-bold text-white">{t("plans.assignmentsTitle")}</h2>
        <p className="mt-2 text-sm text-gray-400">{t("plans.assignmentsDescription")}</p>
      </div>

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
        </div>
      ) : error ? (
        <TrainingErrorState message={error} />
      ) : horses.length > 0 ? (
        <ul className="space-y-2">
          {horses.map((horse) => {
            const isSelected = selectedSet.has(horse.id);

            return (
              <li key={horse.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                    isSelected
                      ? "border-blue-500/40 bg-[#0B1730]"
                      : "border-white/10 bg-[#08111F] hover:border-blue-500/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleHorse(horse.id)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-[#08111F] text-blue-600 focus:ring-blue-500/40"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{horse.name}</span>
                    <span className="mt-1 block text-sm text-gray-400">{horse.subtitle}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <TrainingEmptyState
          title={t("plans.noManageableHorsesTitle")}
          description={t("plans.noManageableHorsesDescription")}
        />
      )}

      <p className="mt-4 text-sm text-gray-500">
        {t("plans.horsesSelected", { count: selectedHorseIds.length })}
      </p>
    </section>
  );
}
