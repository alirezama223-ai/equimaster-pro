export function formatEventTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function todayStartIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export const SEVERITY_PRIORITY: Record<string, number> = {
  alert: 0,
  watch: 1,
  info: 2,
  positive: 3,
};

export function sortEventsByUrgency<T extends { severity: string; createdAt: string }>(events: T[]): T[] {
  return [...events].sort((left, right) => {
    const severityDiff =
      (SEVERITY_PRIORITY[left.severity] ?? 99) - (SEVERITY_PRIORITY[right.severity] ?? 99);
    if (severityDiff !== 0) return severityDiff;
    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function severityBadgeClass(severity: string): string {
  switch (severity) {
    case "alert":
      return "bg-red-500/20 text-red-200";
    case "watch":
      return "bg-amber-500/20 text-amber-200";
    case "positive":
      return "bg-emerald-500/20 text-emerald-200";
    default:
      return "bg-blue-500/20 text-blue-200";
  }
}

export function sourceModuleLabel(sourceModule: string): string {
  switch (sourceModule) {
    case "rule_engine":
      return "Rule Engine";
    case "training":
      return "Training";
    case "health":
      return "Health";
    case "analytics":
      return "Analytics";
    default:
      return sourceModule;
  }
}
