"use client";

import { useTranslations } from "next-intl";
import { formatDurationMinutes, sessionStatusClassName } from "@/app/lib/training/format";
import type { TrainingRecentSession, TrainingSessionStatus } from "@/app/types/training";

type Props = {
  sessions: TrainingRecentSession[];
};

export default function TrainingRecentSessions({ sessions }: Props) {
  const t = useTranslations("training");

  function statusLabel(status: TrainingSessionStatus): string {
    return t(`sessionStatus.${status}` as Parameters<typeof t>[0]);
  }

  return (
    <ul className="space-y-3">
      {sessions.map((session) => (
        <li
          key={session.id}
          className="rounded-2xl border border-white/10 bg-[#08111F] px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{session.title}</p>
              <p className="mt-1 text-xs text-gray-500">{session.dateLabel}</p>
              <p className="mt-2 text-xs text-gray-400">
                {t("recentSessions.duration", {
                  duration: formatDurationMinutes(session.durationMinutes),
                })}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${sessionStatusClassName(session.status)}`}
            >
              {statusLabel(session.status)}
            </span>
          </div>
          {session.notesPreview ? (
            <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-gray-300">
              {session.notesPreview}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
