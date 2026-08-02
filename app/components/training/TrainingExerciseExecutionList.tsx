"use client";

import TrainingExerciseExecutionCard from "@/app/components/training/TrainingExerciseExecutionCard";
import type { TrainingSessionExercise } from "@/app/types/training";

type Props = {
  exercises: TrainingSessionExercise[];
  disabled?: boolean;
  savingExerciseId: string | null;
  onStart: (exerciseId: string) => void;
  onComplete: (exerciseId: string) => void;
  onSkip: (exerciseId: string) => void;
  onNotesChange: (exerciseId: string, notes: string) => void;
};

export default function TrainingExerciseExecutionList({
  exercises,
  disabled,
  savingExerciseId,
  onStart,
  onComplete,
  onSkip,
  onNotesChange,
}: Props) {
  return (
    <ul className="space-y-3">
      {exercises.map((exercise) => (
        <TrainingExerciseExecutionCard
          key={exercise.id}
          label={exercise.label}
          category={exercise.category}
          durationMinutes={exercise.durationMinutes}
          planNotes={exercise.planNotes}
          status={exercise.status}
          executionNotes={exercise.executionNotes}
          disabled={disabled}
          saving={savingExerciseId === exercise.id}
          onStart={() => onStart(exercise.id)}
          onComplete={() => onComplete(exercise.id)}
          onSkip={() => onSkip(exercise.id)}
          onNotesChange={(notes) => onNotesChange(exercise.id, notes)}
        />
      ))}
    </ul>
  );
}
