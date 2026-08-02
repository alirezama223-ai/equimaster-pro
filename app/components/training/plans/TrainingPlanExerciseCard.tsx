"use client";

import { useTranslations } from "next-intl";
import type { TrainingPlanEditorExercise } from "@/app/lib/training/plans/editor-types";

type Props = {
  exercise: TrainingPlanEditorExercise;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export default function TrainingPlanExerciseCard({
  exercise,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
}: Props) {
  const t = useTranslations("training");

  return (
    <li className="rounded-2xl border border-white/10 bg-[#08111F] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{exercise.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gray-500">{exercise.category}</p>
        </div>
        <p className="shrink-0 text-sm font-medium text-blue-300">{exercise.durationLabel}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
        <button
          type="button"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("plans.moveUp")}
        </button>
        <button
          type="button"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("plans.moveDown")}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border border-red-500/20 px-2.5 py-1 text-xs font-medium text-red-200 transition hover:border-red-500/40 hover:text-red-100"
        >
          {t("plans.remove")}
        </button>
      </div>
    </li>
  );
}
