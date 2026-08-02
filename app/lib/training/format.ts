import { formatPedigreeSexLabel } from "@/app/lib/pedigree";
import type { PedigreeSex } from "@/app/types/pedigree";
import type { TrainingSessionStatus } from "@/app/types/training";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const SESSION_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function formatTrainingHorseSubtitle(sex: string, discipline: string | null): string {
  const sexLabel = formatPedigreeSexLabel(sex as PedigreeSex);
  const disciplineLabel = discipline?.trim() || "—";
  return `${sexLabel} · ${disciplineLabel}`;
}

export function formatSessionDateLabel(sessionDate: string): string {
  const date = parseDateOnly(sessionDate);
  return SESSION_DATE_FORMATTER.format(date);
}

export function formatSessionStatusLabel(status: TrainingSessionStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "skipped":
      return "Skipped";
    case "in_progress":
      return "In progress";
    case "planned":
      return "Planned";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function sessionStatusClassName(status: TrainingSessionStatus): string {
  switch (status) {
    case "completed":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
    case "skipped":
      return "text-amber-200 bg-amber-500/10 border-amber-500/30";
    case "in_progress":
      return "text-blue-200 bg-blue-500/10 border-blue-500/30";
    case "planned":
      return "text-gray-300 bg-white/5 border-white/10";
    case "cancelled":
      return "text-red-200 bg-red-500/10 border-red-500/30";
    default:
      return "text-gray-300 bg-white/5 border-white/10";
  }
}

export function computePlanSchedule(
  startDate: string,
  referenceDate: Date = new Date()
): { week: string; day: string } {
  const start = parseDateOnly(startDate);
  const today = parseDateOnly(toDateOnlyString(referenceDate));
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const dayNumber = Math.max(diffDays + 1, 1);
  const weekNumber = Math.floor(Math.max(diffDays, 0) / 7) + 1;
  const weekday = WEEKDAY_FORMATTER.format(today);

  return {
    week: `Week ${weekNumber}`,
    day: `Day ${dayNumber} — ${weekday}`,
  };
}

export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export { parseDateOnly };

export function defaultSessionTitle(sessionDate: string): string {
  return `Training session · ${formatSessionDateLabel(sessionDate)}`;
}

export function formatDurationMinutes(durationMinutes: number | null | undefined): string {
  if (durationMinutes == null || durationMinutes <= 0) {
    return "—";
  }
  return `${durationMinutes} min`;
}

export function formatCompletionRate(completedSessions: number, totalSessions: number): string {
  if (totalSessions <= 0) {
    return "0%";
  }
  return `${Math.round((completedSessions / totalSessions) * 100)}%`;
}

export function firstLineOfText(text: string | null | undefined): string | null {
  if (!text?.trim()) {
    return null;
  }
  return text.trim().split(/\r?\n/)[0] ?? null;
}

const ACTIVITY_DAY_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function formatActivityDayLabel(sessionDate: string): string {
  return ACTIVITY_DAY_FORMATTER.format(parseDateOnly(sessionDate));
}

export function buildLastSevenDayRange(referenceDate: Date = new Date()): string[] {
  return buildDayRange(referenceDate, 30).slice(-7);
}

export function buildLastThirtyDayRange(referenceDate: Date = new Date()): string[] {
  return buildDayRange(referenceDate, 30);
}

function buildDayRange(referenceDate: Date, totalDays: number): string[] {
  const days: string[] = [];
  const anchor = parseDateOnly(toDateOnlyString(referenceDate));

  for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(anchor);
    date.setDate(date.getDate() - offset);
    days.push(toDateOnlyString(date));
  }

  return days;
}

const CALENDAR_MONTH_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

export function formatCalendarMonthLabel(year: number, month: number): string {
  return CALENDAR_MONTH_FORMATTER.format(new Date(year, month, 1));
}

export type TrainingCalendarIndicatorStatus =
  | "completed"
  | "in_progress"
  | "planned"
  | "cancelled"
  | "skipped"
  | "none";

export function calendarIndicatorClassName(status: TrainingCalendarIndicatorStatus): string {
  switch (status) {
    case "completed":
      return "bg-emerald-400";
    case "in_progress":
      return "bg-blue-400";
    case "planned":
      return "bg-gray-400";
    case "cancelled":
      return "bg-red-400";
    case "skipped":
      return "bg-amber-300";
    default:
      return "bg-white/10";
  }
}

export function toCalendarIndicatorStatus(
  status: TrainingSessionStatus | null | undefined
): TrainingCalendarIndicatorStatus {
  if (!status) {
    return "none";
  }
  if (
    status === "completed" ||
    status === "in_progress" ||
    status === "planned" ||
    status === "cancelled" ||
    status === "skipped"
  ) {
    return status;
  }
  return "none";
}

export function calendarIndicatorLabel(status: TrainingCalendarIndicatorStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    case "planned":
      return "Planned";
    case "cancelled":
      return "Cancelled";
    case "skipped":
      return "Skipped";
    default:
      return "No Session";
  }
}
