import type { TrainingExerciseItem } from "@/app/types/training";

type Props = {
  exercises: TrainingExerciseItem[];
};

export default function TrainingExercisesChecklist({ exercises }: Props) {
  return (
    <ul className="space-y-3">
      {exercises.map((exercise) => (
        <li
          key={exercise.id}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#08111F] px-4 py-3"
        >
          <span className="text-lg leading-none text-gray-400" aria-hidden="true">
            ☐
          </span>
          <span className="text-sm font-medium text-white">{exercise.label}</span>
        </li>
      ))}
    </ul>
  );
}
