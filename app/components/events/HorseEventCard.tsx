"use client";

import { useTranslations } from "next-intl";
import type { HorseEvent } from "@/app/types/events";
import { severityBadgeClass } from "@/app/lib/events/format";

type Props = {
  event: HorseEvent;
  onResolve?: (eventId: string) => void;
  resolving?: boolean;
  compact?: boolean;
};

export default function HorseEventCard({
  event,
  onResolve,
  resolving = false,
  compact = false,
}: Props) {
  const t = useTranslations("events");

  return (
    <article
      className={`rounded-2xl border border-white/10 bg-[#0f172a] ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${severityBadgeClass(event.severity)}`}
            >
              {t(`eventCard.severity.${event.severity}` as Parameters<typeof t>[0])}
            </span>
            <span className="text-xs uppercase tracking-[0.14em] text-gray-500">
              {t(`eventCard.sourceModule.${event.sourceModule}` as Parameters<typeof t>[0])}
            </span>
            <span className="text-xs text-gray-600">{event.eventType.replaceAll("_", " ")}</span>
          </div>
          <h3 className={`mt-2 font-semibold text-white ${compact ? "text-sm" : "text-base"}`}>
            {event.title}
          </h3>
          {!compact ? (
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{event.description}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400 line-clamp-2">{event.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
            {event.horseName ? <span>{event.horseName}</span> : null}
            <span>{event.createdAtLabel}</span>
          </div>
        </div>

        {onResolve && !event.resolved ? (
          <button
            type="button"
            disabled={resolving}
            onClick={() => onResolve(event.id)}
            className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition hover:border-emerald-500/40 hover:text-emerald-200 disabled:opacity-50"
          >
            {t("eventCard.resolve")}
          </button>
        ) : null}
      </div>
    </article>
  );
}
