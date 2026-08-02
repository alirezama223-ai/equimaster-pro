"use client";

import { useTranslations } from "next-intl";
import {
  calendarIndicatorClassName,
  formatSessionDateLabel,
  sessionStatusClassName,
} from "@/app/lib/training/format";
import type { TrainingCalendarDay, TrainingCalendarMonth, TrainingSessionStatus } from "@/app/types/training";
import type { TrainingCalendarIndicatorStatus } from "@/app/lib/training/format";

type Props = {
  calendar: TrainingCalendarMonth;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
};

const LEGEND_ITEMS = [
  "completed",
  "in_progress",
  "planned",
  "cancelled",
  "none",
] as const;

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function CalendarDetailsPanel({
  day,
  horseName,
  onClose,
  t,
}: {
  day: TrainingCalendarDay;
  horseName: string;
  onClose: () => void;
  t: ReturnType<typeof useTranslations<"training">>;
}) {
  const session = day.session;

  function statusLabel(status: TrainingSessionStatus | TrainingCalendarIndicatorStatus): string {
    if (status === "skipped") {
      return t("calendarIndicator.skipped");
    }
    return t(`sessionStatus.${status}` as Parameters<typeof t>[0]);
  }

  const displayStatusLabel = session
    ? statusLabel(session.status)
    : t("calendarIndicator.none");

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-[#08111F] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-blue-400">{t("calendar.dayDetails")}</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {session?.dateLabel ?? formatSessionDateLabel(day.date)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-400 transition hover:border-white/20 hover:text-white"
        >
          {t("calendar.close")}
        </button>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("calendar.horse")}</dt>
          <dd className="mt-1 text-white">{session?.horseName ?? horseName}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("calendar.status")}</dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${session ? sessionStatusClassName(session.status) : "text-gray-300 bg-white/5 border-white/10"}`}
            >
              {displayStatusLabel}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("calendar.sessionDate")}</dt>
          <dd className="mt-1 text-gray-300">{session?.dateLabel ?? formatSessionDateLabel(day.date)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("calendar.notesPreview")}</dt>
          <dd className="mt-1 text-gray-300">
            {session?.notesPreview ?? t("calendar.noNotesForDay")}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function TrainingCalendar({ calendar, selectedDate, onSelectDate }: Props) {
  const t = useTranslations("training");
  const selectedDay = calendar.days.find((day) => day.date === selectedDate) ?? null;

  function indicatorLabel(status: TrainingCalendarIndicatorStatus): string {
    if (status === "in_progress") {
      return t("calendarIndicator.in_progress");
    }
    if (status === "none") {
      return t("calendarIndicator.none");
    }
    return t(`sessionStatus.${status}` as Parameters<typeof t>[0]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold text-white">{calendar.monthLabel}</p>
        <div className="flex flex-wrap gap-3">
          {LEGEND_ITEMS.map((status) => (
            <div key={status} className="flex items-center gap-2 text-xs text-gray-400">
              <span className={`h-2.5 w-2.5 rounded-full ${calendarIndicatorClassName(status)}`} />
              <span>{indicatorLabel(status)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.16em] text-gray-500">
        {WEEKDAY_KEYS.map((weekday) => (
          <div key={weekday} className="py-1">
            {t(`calendar.weekdays.${weekday}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendar.days.map((day) => {
          const isSelected = selectedDate === day.date;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              className={`flex min-h-16 flex-col items-center justify-between rounded-2xl border px-2 py-2 transition ${
                day.isCurrentMonth ? "border-white/10 bg-[#08111F]" : "border-white/5 bg-[#08111F]/40"
              } ${day.isToday ? "ring-1 ring-blue-500/60" : ""} ${
                isSelected ? "border-blue-500/40 bg-[#0B1730]" : "hover:border-blue-500/30"
              }`}
            >
              <span className={`text-sm font-medium ${day.isCurrentMonth ? "text-white" : "text-gray-500"}`}>
                {day.dayNumber}
              </span>
              <span
                className={`mt-2 h-2.5 w-2.5 rounded-full ${calendarIndicatorClassName(day.indicatorStatus)}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {selectedDay ? (
        <CalendarDetailsPanel
          day={selectedDay}
          horseName={calendar.horseName}
          onClose={() => onSelectDate(null)}
          t={t}
        />
      ) : null}
    </div>
  );
}
