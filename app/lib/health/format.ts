export function formatHealthDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T12:00:00`);
  const to = new Date(`${toDate}T12:00:00`);
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isOverdue(dueDate: string | null, referenceDate = todayIsoDate()): boolean {
  if (!dueDate) return false;
  return dueDate < referenceDate;
}

export const FEVER_THRESHOLD_CELSIUS = 38.5;

export function labelAppetite(value: string | null): string {
  if (!value) return "Not recorded";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function labelInjuryStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function labelInjurySeverity(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}
