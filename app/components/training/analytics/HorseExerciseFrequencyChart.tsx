"use client";

import { useTranslations } from "next-intl";
import { formatExerciseCategory } from "@/app/lib/training/plans/exercises";
import type { ExerciseFrequencyItem } from "@/app/types/training-analytics";

type Props = {
  exercises: ExerciseFrequencyItem[];
};

export default function HorseExerciseFrequencyChart({ exercises }: Props) {
  const t = useTranslations("training");

  if (exercises.length === 0) {
    return <p className="text-sm text-gray-400">{t("analytics.frequencyEmpty")}</p>;
  }

  const maxCount = Math.max(...exercises.map((exercise) => exercise.count), 1);

  return (
    <ul className="space-y-3">
      {exercises.map((exercise) => {
        const widthPercent = (exercise.count / maxCount) * 100;
        return (
          <li key={exercise.exerciseId} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{exercise.label}</p>
                {exercise.category ? (
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
                    {formatExerciseCategory(exercise.category)}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-gray-300">{exercise.count}×</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
