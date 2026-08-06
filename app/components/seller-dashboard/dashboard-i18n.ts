import { useCallback } from "react";
import { useTranslations } from "next-intl";

export type DashboardTranslator = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

export function formatDashboardRelativeTime(iso: string, t: DashboardTranslator): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return t("relativeTime.justNow");
  if (minutes < 60) return t("relativeTime.minutesAgo", { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("relativeTime.hoursAgo", { count: hours });

  const days = Math.floor(hours / 24);
  if (days === 1) return t("relativeTime.yesterday");
  if (days < 7) return t("relativeTime.daysAgo", { count: days });

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function useDashboardRelativeTime() {
  const t = useTranslations("dashboard");
  return useCallback((iso: string) => formatDashboardRelativeTime(iso, t), [t]);
}

export function getGreetingPrefix(t: DashboardTranslator, hour = new Date().getHours()): string {
  if (hour < 12) return t("greeting.morning");
  if (hour < 17) return t("greeting.afternoon");
  return t("greeting.evening");
}
