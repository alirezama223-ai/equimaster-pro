"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { formatDurationMinutes } from "@/app/lib/training/format";

type Props = {
  startedAt: string | null;
  isActive: boolean;
  completedDurationMinutes?: number | null;
};

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getElapsedSeconds(startedAt: string): number {
  const startedMs = new Date(startedAt).getTime();
  return Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
}

export default function TrainingSessionTimer({
  startedAt,
  isActive,
  completedDurationMinutes,
}: Props) {
  const t = useTranslations("training");
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    startedAt && isActive ? getElapsedSeconds(startedAt) : 0
  );

  useEffect(() => {
    if (!startedAt || !isActive) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(getElapsedSeconds(startedAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [startedAt, isActive]);

  const displayValue =
    !isActive && completedDurationMinutes
      ? formatDurationMinutes(completedDurationMinutes)
      : formatElapsed(elapsedSeconds);

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">{t("sessionTimer.duration")}</p>
      <p className="mt-2 font-mono text-3xl font-bold text-white">{displayValue}</p>
      <p className="mt-1 text-xs text-gray-400">
        {isActive ? t("sessionTimer.timerRunning") : t("sessionTimer.sessionCompleted")}
      </p>
    </div>
  );
}

export function getElapsedMinutes(startedAt: string | null): number {
  if (!startedAt) return 1;
  const elapsedSeconds = getElapsedSeconds(startedAt);
  return Math.max(1, Math.round(elapsedSeconds / 60));
}
