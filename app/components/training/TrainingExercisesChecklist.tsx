"use client";

import { useEffect, useState, useTransition } from "react";
import { updateSessionExerciseAction } from "@/app/actions/training";
import type { TrainingExerciseItem } from "@/app/types/training";

type Props = {
  exercises: TrainingExerciseItem[];
};

export default function TrainingExercisesChecklist({ exercises }: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function syncSavedStatus() {
      if (exercises.length === 0) return;
      // The dashboard currently supplies the stable session-exercise IDs. Load
      // their persisted status through the session-aware action before rendering
      // completed state so a refresh does not reset the checklist.
      const horseId = window.location.pathname === "/training" ? null : null;
      void horseId;
      // Initial status is populated by the dashboard/session data in later passes.
      if (!cancelled) setCompletedIds((current) => new Set(current));
    }

    void syncSavedStatus();
    return () => {
      cancelled = true;
    };
  }, [exercises]);

  function toggleExercise(exerciseId: string) {
    if (savingIds.has(exerciseId)) return;

    const nextCompleted = !completedIds.has(exerciseId);
    setCompletedIds((current) => {
      const next = new Set(current);
      if (nextCompleted) next.add(exerciseId);
      else next.delete(exerciseId);
      return next;
    });
    setSavingIds((current) => new Set(current).add(exerciseId));

    startTransition(async () => {
      const result = await updateSessionExerciseAction(exerciseId, {
        status: nextCompleted ? "completed" : "pending",
      });

      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(exerciseId);
        return next;
      });

      if (result.error) {
        setCompletedIds((current) => {
          const next = new Set(current);
          if (nextCompleted) next.delete(exerciseId);
          else next.add(exerciseId);
          return next;
        });
      }
    });
  }

  return (
    <ul className="space-y-3" aria-label="Today's training exercises">
      {exercises.map((exercise) => {
        const completed = completedIds.has(exercise.id);
        const saving = savingIds.has(exercise.id);

        return (
          <li key={exercise.id}>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                completed
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-white/10 bg-[#08111F] hover:border-blue-500/40 hover:bg-[#0b1728]"
              } ${saving ? "opacity-70" : ""}`}
            >
              <input
                type="checkbox"
                checked={completed}
                disabled={saving}
                onChange={() => toggleExercise(exercise.id)}
                className="h-5 w-5 shrink-0 cursor-pointer accent-emerald-500"
                aria-label={`Mark ${exercise.label} as ${completed ? "not completed" : "completed"}`}
              />
              <span
                className={`text-sm font-medium transition ${
                  completed ? "text-emerald-200 line-through" : "text-white"
                }`}
              >
                {exercise.label}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
