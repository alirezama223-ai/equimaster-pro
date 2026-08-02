"use client";

import { useTranslations } from "next-intl";
import type { TrainingPlanEditorWeek } from "@/app/lib/training/plans/editor-types";

type Props = {
  weeks: TrainingPlanEditorWeek[];
  selectedWeekId: string;
  onSelectWeek: (weekId: string) => void;
  onAddWeek: () => void;
};

export default function TrainingPlanWeekTabs({
  weeks,
  selectedWeekId,
  onSelectWeek,
  onAddWeek,
}: Props) {
  const t = useTranslations("training");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("plans.weeks")}>
        {weeks.map((week) => {
          const isSelected = week.id === selectedWeekId;
          const label = week.title
            ? t("plans.weekTabWithTitle", { number: week.weekNumber, title: week.title })
            : t("plans.weekTabLabel", { number: week.weekNumber });

          return (
            <button
              key={week.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectWeek(week.id)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                isSelected
                  ? "border-blue-500/40 bg-[#0B1730] text-white"
                  : "border-white/10 bg-[#111827] text-gray-400 hover:border-blue-500/30 hover:text-white"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddWeek}
        className="rounded-xl border border-dashed border-blue-500/30 bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:border-blue-500/50 hover:bg-blue-600/20"
      >
        {t("plans.addWeek")}
      </button>
    </div>
  );
}
