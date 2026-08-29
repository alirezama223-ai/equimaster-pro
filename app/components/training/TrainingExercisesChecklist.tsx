"use client";

import { useState } from "react";
import type { TrainingExerciseItem } from "@/app/types/training";

type Props = {
  exercises: TrainingExerciseItem[];
};

export default function TrainingExercisesChecklist({ exercises }: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());

  function toggleExercise(exerciseId: string) {
    setCompletedIds((current) => {
      const next = new Set(current);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  }

  return (
    <ul className="space-y-3" aria-label="Today's training exercises">
      {exercises.map((exercise) => {
        const completed = completedIds.has(exercise.id);

        return (
          <li key={exercise.id}>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                completed
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-white/10 bg-[#08111F] hover:border-blue-500/40 hover:bg-[#0b1728]"
              }`}
            >
              <input
                type="checkbox"
                checked={completed}
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
