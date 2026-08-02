import { parseDateOnly, toDateOnlyString } from "@/app/lib/training/format";

export type PlanDayPosition = {
  weekNumber: number;
  dayNumber: number;
  planDayIndex: number;
};

/** When a plan has no start_date, anchor scheduling on the session date (week 1 / day 1). */
export function resolveEffectivePlanStartDate(
  startDate: string | null | undefined,
  referenceDate: Date = new Date()
): string {
  return startDate?.trim() || toDateOnlyString(referenceDate);
}

/**
 * Maps a calendar date to the plan week/day slot anchored on plan start_date.
 * Week 1 day 1 is the start date; day numbers cycle 1–7 within each week.
 */
export function resolvePlanDayPosition(
  startDate: string,
  referenceDate: Date = new Date()
): PlanDayPosition | null {
  const start = parseDateOnly(startDate);
  const today = parseDateOnly(toDateOnlyString(referenceDate));
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return null;
  }

  return {
    weekNumber: Math.floor(diffDays / 7) + 1,
    dayNumber: (diffDays % 7) + 1,
    planDayIndex: diffDays + 1,
  };
}
