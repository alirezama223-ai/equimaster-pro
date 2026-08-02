import type { RatingTrendPoint, TrainingLoadDay } from "@/app/types/training-analytics";
import { parseDateOnly, toDateOnlyString } from "@/app/lib/training/format";

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function sumTrainingLoad(days: TrainingLoadDay[]): {
  sessionCount: number;
  totalDurationMinutes: number;
} {
  return days.reduce(
    (accumulator, day) => ({
      sessionCount: accumulator.sessionCount + day.sessionCount,
      totalDurationMinutes: accumulator.totalDurationMinutes + day.totalDurationMinutes,
    }),
    { sessionCount: 0, totalDurationMinutes: 0 }
  );
}

export function recentRatingAverages(ratingsOverTime: RatingTrendPoint[]): {
  recent: number | null;
  prior: number | null;
} {
  const recent = average(ratingsOverTime.slice(-3).map((point) => point.rating));
  const prior = average(ratingsOverTime.slice(-6, -3).map((point) => point.rating));
  return { recent, prior };
}

export function daysSinceDate(date: string | null, referenceDate: Date = new Date()): number | null {
  if (!date) return null;

  const anchor = parseDateOnly(toDateOnlyString(referenceDate));
  const target = parseDateOnly(date);
  return Math.floor((anchor.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

export function severityFromScore(score: number): "positive" | "info" | "watch" | "alert" {
  if (score >= 85) return "positive";
  if (score >= 70) return "info";
  if (score >= 50) return "watch";
  return "alert";
}
