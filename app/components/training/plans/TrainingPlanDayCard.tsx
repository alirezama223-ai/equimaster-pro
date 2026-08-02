"use client";

import { useTranslations } from "next-intl";
import {
  formatTrainingPlanDayHeading,
  type TrainingPlanEditorDay,
} from "@/app/lib/training/plans/editor-types";
import TrainingPlanExerciseCard from "@/app/components/training/plans/TrainingPlanExerciseCard";
import TrainingPlanRestDay from "@/app/components/training/plans/TrainingPlanRestDay";

type Props = {
  day: TrainingPlanEditorDay;
  onAddExercise: () => void;
  onMoveExerciseUp: (exerciseInstanceId: string) => void;
  onMoveExerciseDown: (exerciseInstanceId: string) => void;
  onRemoveExercise: (exerciseInstanceId: string) => void;
  onToggleRestDay: (isRestDay: boolean) => void;
  onUpdateTitle: (title: string) => void;
  onUpdateGoal: (goal: string) => void;
};

export default function TrainingPlanDayCard({
  day,
  onAddExercise,
  onMoveExerciseUp,
  onMoveExerciseDown,
  onRemoveExercise,
  onToggleRestDay,
  onUpdateTitle,
  onUpdateGoal,
}: Props) {
  const t = useTranslations("training");
  const heading = formatTrainingPlanDayHeading(day);
  const orderedExercises = [...day.exercises].sort((a, b) => a.sortOrder - b.sortOrder);
  const showRestDay = day.isRestDay && orderedExercises.length === 0;

  return (
    <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#111827] p-4 sm:p-5">
      <header className="mb-4 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-blue-400">{heading}</p>
        <label className="block">
          <span className="sr-only">{t("plans.dayTitleSrOnly")}</span>
          <input
            type="text"
            value={day.title ?? ""}
            onChange={(event) => onUpdateTitle(event.target.value)}
            placeholder={t("plans.dayTitlePlaceholder")}
            className="w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm font-semibold text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label className="block">
          <span className="sr-only">{t("plans.dayGoalSrOnly")}</span>
          <textarea
            value={day.goal ?? ""}
            onChange={(event) => onUpdateGoal(event.target.value)}
            rows={2}
            placeholder={t("plans.dayGoalPlaceholder")}
            className="w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm leading-relaxed text-gray-300 placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
      </header>

      <div className="flex-1">
        {showRestDay ? (
          <TrainingPlanRestDay dayLabel={day.dayLabel} />
        ) : orderedExercises.length > 0 ? (
          <ul className="space-y-2">
            {orderedExercises.map((exercise, index) => (
              <TrainingPlanExerciseCard
                key={exercise.id}
                exercise={exercise}
                canMoveUp={index > 0}
                canMoveDown={index < orderedExercises.length - 1}
                onMoveUp={() => onMoveExerciseUp(exercise.id)}
                onMoveDown={() => onMoveExerciseDown(exercise.id)}
                onRemove={() => onRemoveExercise(exercise.id)}
              />
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#08111F] px-4 py-6 text-center">
            <p className="text-sm text-gray-400">{t("plans.noExercisesAdded")}</p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {!showRestDay ? (
          <button
            type="button"
            onClick={onAddExercise}
            className="inline-flex w-full items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/10 px-4 py-2.5 text-sm font-semibold text-blue-200 transition hover:border-blue-500/50 hover:bg-blue-600/20"
          >
            {t("plans.addExercise")}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => onToggleRestDay(!day.isRestDay)}
          className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white"
        >
          {day.isRestDay ? t("plans.clearRestDay") : t("plans.markRestDay")}
        </button>
      </div>
    </article>
  );
}
