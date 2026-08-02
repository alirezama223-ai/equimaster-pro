"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { getHorseEventTimeline, getTimelineHorses } from "@/app/actions/events";
import DashboardCard from "@/app/components/shared/DashboardCard";
import HorseEventCard from "@/app/components/events/HorseEventCard";
import EmptyState from "@/app/components/shared/EmptyState";
import ErrorState from "@/app/components/shared/ErrorState";
import TrainingHorseSelector from "@/app/components/training/TrainingHorseSelector";
import type { HorseEvent } from "@/app/types/events";
import type { TrainingHorse } from "@/app/types/training";

type Props = {
  initialHorseId?: string;
  backHref?: string;
  backLabel?: string;
};

export default function HorseTimelineClient({
  initialHorseId,
  backHref = "/training",
  backLabel,
}: Props) {
  const t = useTranslations("events");
  const resolvedBackLabel = backLabel ?? t("timeline.backToTraining");
  const router = useRouter();
  const searchParams = useSearchParams();
  const horseIdFromUrl = searchParams.get("horseId");
  const [, startTransition] = useTransition();

  const [horses, setHorses] = useState<TrainingHorse[]>([]);
  const [selectedHorseId, setSelectedHorseId] = useState(initialHorseId ?? "");
  const [events, setEvents] = useState<HorseEvent[]>([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [horsesLoading, setHorsesLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback((horseId: string) => {
    if (!horseId) {
      setEvents([]);
      setUnresolvedCount(0);
      setTimelineLoading(false);
      return;
    }

    setTimelineLoading(true);
    setError(null);

    startTransition(async () => {
      const result = await getHorseEventTimeline(horseId);
      if (result.error) {
        setError(result.error);
        setEvents([]);
        setUnresolvedCount(0);
      } else if (result.timeline) {
        setEvents(result.timeline.events);
        setUnresolvedCount(result.timeline.unresolvedCount);
      }
      setTimelineLoading(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHorses() {
      setHorsesLoading(true);
      const result = await getTimelineHorses();
      if (cancelled) return;

      setHorses(result.horses);
      setHorsesLoading(false);

      const preferredHorseId =
        (initialHorseId && result.horses.some((horse) => horse.id === initialHorseId)
          ? initialHorseId
          : null) ??
        (horseIdFromUrl && result.horses.some((horse) => horse.id === horseIdFromUrl)
          ? horseIdFromUrl
          : null) ??
        result.horses[0]?.id ??
        "";

      setSelectedHorseId(preferredHorseId);
      if (preferredHorseId) {
        loadTimeline(preferredHorseId);
      }
    }

    void loadHorses();

    return () => {
      cancelled = true;
    };
  }, [horseIdFromUrl, initialHorseId, loadTimeline]);

  function handleHorseSelect(horseId: string) {
    setSelectedHorseId(horseId);
    router.replace(`/training/timeline?horseId=${horseId}`);
    loadTimeline(horseId);
  }

  const horseName = horses.find((horse) => horse.id === selectedHorseId)?.name ?? t("timeline.defaultHorseName");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {backHref ? (
            <Link href={backHref} className="text-sm text-gray-400 transition hover:text-white">
              ← {resolvedBackLabel}
            </Link>
          ) : null}
          <h1 className="mt-3 text-4xl font-bold text-white">{t("timeline.title")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            {t("timeline.description")}
          </p>
        </div>

        {!horsesLoading && horses.length > 0 ? (
          <TrainingHorseSelector
            horses={horses}
            selectedHorseId={selectedHorseId}
            onSelect={handleHorseSelect}
          />
        ) : null}
      </div>

      {error ? <ErrorState message={error} /> : null}

      {!horsesLoading && horses.length === 0 ? (
        <EmptyState
          title={t("timeline.noManageableHorsesTitle")}
          description={t("timeline.noManageableHorsesDescription")}
        />
      ) : null}

      {selectedHorseId ? (
        <DashboardCard
          title={t("timeline.eventTimelineTitle", { horseName })}
          description={t("timeline.unresolvedCount", { count: unresolvedCount })}
          loading={timelineLoading}
        >
          {!timelineLoading ? (
            events.length === 0 ? (
              <EmptyState
                title={t("timeline.noEventsTitle")}
                description={t("timeline.noEventsDescription")}
              />
            ) : (
              <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-0.5rem)] before:w-px before:bg-white/10">
                {events.map((event) => (
                  <div key={event.id} className="relative">
                    <span
                      className={`absolute -left-[1.35rem] top-5 h-3 w-3 rounded-full border-2 border-[#111827] ${
                        event.resolved ? "bg-gray-600" : event.severity === "alert" ? "bg-red-400" : "bg-amber-300"
                      }`}
                    />
                    <HorseEventCard event={event} />
                  </div>
                ))}
              </div>
            )
          ) : null}
        </DashboardCard>
      ) : null}
    </div>
  );
}
