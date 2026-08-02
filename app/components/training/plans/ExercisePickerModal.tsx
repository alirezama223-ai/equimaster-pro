"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import type { ExerciseLibraryItem } from "@/app/lib/training/plans/exercises";

type Props = {
  isOpen: boolean;
  dayLabel: string;
  exercises: ExerciseLibraryItem[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSelect: (exercise: ExerciseLibraryItem) => void;
};

export default function ExercisePickerModal({
  isOpen,
  dayLabel,
  exercises,
  loading,
  error,
  onClose,
  onSelect,
}: Props) {
  const t = useTranslations("training");
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (!isOpen) return;

    console.log("[ExercisePickerModal] render state", {
      isOpen,
      loading,
      error,
      exerciseCount: exercises.length,
      sample: exercises.slice(0, 3).map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
      })),
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-white/10 bg-[#111C2E] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-picker-title"
      >
        <div className="border-b border-white/10 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">{t("plans.exerciseLibraryEyebrow")}</p>
          <h2 id="exercise-picker-title" className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {t("plans.addExerciseTitle")}
          </h2>
          <p className="mt-2 text-sm text-gray-400">{t("plans.addExerciseDescription", { dayLabel })}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {loading ? (
            <div className="space-y-3" aria-hidden="true">
              <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-4">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          ) : exercises.length > 0 ? (
            <ul className="space-y-2">
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(exercise)}
                    className="flex w-full items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#08111F] px-4 py-4 text-left transition hover:border-blue-500/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{exercise.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gray-500">
                        {exercise.category}
                      </p>
                      {exercise.description ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-400">
                          {exercise.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-medium text-blue-300">{exercise.durationLabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#08111F] px-4 py-8 text-center">
              <p className="text-sm font-medium text-white">{t("plans.noExercisesAvailable")}</p>
              <p className="mt-2 text-sm text-gray-400">{t("plans.noExercisesAvailableDescription")}</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-4 sm:px-8 sm:py-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white"
          >
            {tCommon("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
