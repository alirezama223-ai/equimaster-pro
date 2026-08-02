"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getTodaysAlerts } from "@/app/actions/events";
import HorseEventCard from "@/app/components/events/HorseEventCard";
import EmptyState from "@/app/components/shared/EmptyState";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import type { HorseEvent } from "@/app/types/events";

type Props = {
  horseId?: string;
};

export default function TodaysAlertsWidget({ horseId }: Props) {
  const t = useTranslations("events");
  const [alerts, setAlerts] = useState<HorseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      setLoading(true);
      const result = await getTodaysAlerts(horseId);
      if (cancelled) return;

      setAlerts(result.data.alerts);
      setError(result.error ?? null);
      setLoading(false);
    }

    void loadAlerts();

    return () => {
      cancelled = true;
    };
  }, [horseId]);

  if (loading) {
    return <LoadingState message={t("alertsWidget.loading")} />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        title={t("alertsWidget.noAlertsTitle")}
        description={t("alertsWidget.noAlertsDescription")}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {t("alertsWidget.alertCount", { count: alerts.length })}
        </p>
        <Link href="/notifications" className="text-sm text-blue-300 hover:text-blue-200">
          {t("alertsWidget.notificationCenter")}
        </Link>
      </div>

      {alerts.slice(0, 4).map((alert) => (
        <HorseEventCard key={alert.id} event={alert} compact />
      ))}
    </div>
  );
}
