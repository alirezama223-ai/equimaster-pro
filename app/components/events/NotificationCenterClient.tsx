"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getNotificationCenter, resolveEventAction } from "@/app/actions/events";
import HorseEventCard from "@/app/components/events/HorseEventCard";
import EmptyState from "@/app/components/shared/EmptyState";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import type { NotificationCenterData } from "@/app/types/events";

const EMPTY_DATA: NotificationCenterData = {
  events: [],
  unresolvedCount: 0,
  alertCount: 0,
};

export default function NotificationCenterClient() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [data, setData] = useState<NotificationCenterData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await getNotificationCenter();
      if (cancelled) return;
      setData(result.data);
      setError(result.error ?? null);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  function reloadCenter() {
    setLoading(true);
    startTransition(async () => {
      const result = await getNotificationCenter();
      setData(result.data);
      setError(result.error ?? null);
      setLoading(false);
    });
  }

  function handleResolve(eventId: string) {
    startTransition(async () => {
      const result = await resolveEventAction(eventId);
      if (result.error) {
        setError(result.error);
        return;
      }
      reloadCenter();
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("center.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{t("center.title")}</h1>
        <p className="mt-3 max-w-2xl text-gray-400">{t("center.description")}</p>
        {!loading ? (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>
              {t("center.unresolvedLabel")}:{" "}
              <span className="font-semibold text-white">{data.unresolvedCount}</span>
            </span>
            <span>
              {t("center.alertsLabel")}:{" "}
              <span className="font-semibold text-red-300">{data.alertCount}</span>
            </span>
          </div>
        ) : null}
      </header>

      {error ? <ErrorState message={error} /> : null}

      {loading ? (
        <LoadingState message={t("center.loading")} />
      ) : data.events.length === 0 ? (
        <EmptyState
          title={t("center.allClearTitle")}
          description={t("center.allClearDescription")}
        />
      ) : (
        <div className="space-y-3">
          {data.events.map((event) => (
            <HorseEventCard
              key={event.id}
              event={event}
              onResolve={handleResolve}
              resolving={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
