import { parseDateOnly } from "@/app/lib/training/format";
import type { TrainingPlanStatus } from "@/app/types/training-plans";

export function formatTrainingPlanStatusLabel(status: TrainingPlanStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export function trainingPlanStatusClassName(status: TrainingPlanStatus): string {
  switch (status) {
    case "active":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
    case "completed":
      return "text-blue-200 bg-blue-500/10 border-blue-500/30";
    case "archived":
      return "text-gray-300 bg-white/5 border-white/10";
    case "draft":
    default:
      return "text-amber-200 bg-amber-500/10 border-amber-500/30";
  }
}

export function formatTrainingPlanDuration(
  startDate: string | null,
  endDate: string | null,
  weekCount?: number
): string {
  if (weekCount != null && weekCount > 0) {
    return weekCount === 1 ? "1 week" : `${weekCount} weeks`;
  }

  if (startDate && endDate) {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    const diffMs = end.getTime() - start.getTime();
    const dayCount = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    if (dayCount <= 0) {
      return "Duration not set";
    }

    if (dayCount < 7) {
      return dayCount === 1 ? "1 day" : `${dayCount} days`;
    }

    const weeks = Math.ceil(dayCount / 7);
    return weeks === 1 ? "1 week" : `${weeks} weeks`;
  }

  if (startDate || endDate) {
    return "Partial schedule";
  }

  return "Duration not set";
}

export function formatAssignedHorseCount(count: number): string {
  if (count === 0) {
    return "No horses assigned";
  }
  return count === 1 ? "1 horse assigned" : `${count} horses assigned`;
}
