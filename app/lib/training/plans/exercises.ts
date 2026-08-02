import { formatDurationMinutes } from "@/app/lib/training/format";

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number | null;
  durationLabel: string;
  description: string | null;
};

const EXERCISE_CATEGORIES: Record<string, string> = {
  warmup: "Warm-up",
  flatwork: "Flatwork",
  jumping: "Jumping",
  polework: "Polework",
  conditioning: "Conditioning",
  cooldown: "Cooldown",
  groundwork: "Groundwork",
  other: "Other",
};

export function formatExerciseCategory(category: string): string {
  return EXERCISE_CATEGORIES[category] ?? category;
}

export function mapExerciseLibraryRow(row: Record<string, unknown>): ExerciseLibraryItem {
  const durationMinutes = (row.duration_minutes as number | null | undefined) ?? null;
  const category = String(row.category);

  return {
    id: row.id as string,
    name: row.name as string,
    category: formatExerciseCategory(category),
    durationMinutes,
    durationLabel: formatDurationMinutes(durationMinutes),
    description: (row.description as string | null | undefined) ?? null,
  };
}
