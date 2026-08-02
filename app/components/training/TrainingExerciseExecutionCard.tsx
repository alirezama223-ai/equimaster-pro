"use client";

import { useTranslations } from "next-intl";
import { formatDurationMinutes } from "@/app/lib/training/format";
import { formatExerciseCategory } from "@/app/lib/training/plans/exercises";
import type { TrainingSessionExerciseStatus } from "@/app/types/training";

type Props = {
  label: string;
  category: string | null;
  durationMinutes: number | null;
  planNotes: string | null;
  status: TrainingSessionExerciseStatus;
  executionNotes: string | null;
  disabled?: boolean;
  saving?: boolean;
  onStart: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onNotesChange: (notes: string) => void;
};

function statusClassName(status: TrainingSessionExerciseStatus): string {
  switch (status) {
    case "in_progress":
      return "text-blue-200 bg-blue-500/10 border-blue-500/30";
    case "completed":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
    case "skipped":
      return "text-amber-200 bg-amber-500/10 border-amber-500/30";
    default:
      return "text-gray-300 bg-white/5 border-white/10";
  }
}

export default function TrainingExerciseExecutionCard({
  label,
  category,
  durationMinutes,
  planNotes,
  status,
  executionNotes,
  disabled,
  saving,
  onStart,
  onComplete,
  onSkip,
  onNotesChange,
}: Props) {
  const t = useTranslations("training");
  const showNotes = status === "in_progress" || status === "completed" || status === "skipped";

  function statusLabel(exerciseStatus: TrainingSessionExerciseStatus): string {
    return t(`sessionStatus.${exerciseStatus}` as Parameters<typeof t>[0]);
  }

  return (
    <li className="rounded-2xl border border-white/10 bg-[#08111F] px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{label}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {category ? (
              <span className="uppercase tracking-[0.16em]">{formatExerciseCategory(category)}</span>
            ) : null}
            {durationMinutes ? <span>{formatDurationMinutes(durationMinutes)}</span> : null}
          </div>
          {planNotes ? (
            <p className="mt-2 text-xs leading-relaxed text-gray-400">{planNotes}</p>
          ) : null}
          <span
            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClassName(status)}`}
          >
            {statusLabel(status)}
          </span>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {status === "pending" ? (
            <>
              <button
                type="button"
                disabled={disabled || saving}
                onClick={onStart}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("exerciseExecution.start")}
              </button>
              <button
                type="button"
                disabled={disabled || saving}
                onClick={onSkip}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-amber-500/40 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("exerciseExecution.skip")}
              </button>
            </>
          ) : null}
          {status === "in_progress" ? (
            <>
              <button
                type="button"
                disabled={disabled || saving}
                onClick={onComplete}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("exerciseExecution.complete")}
              </button>
              <button
                type="button"
                disabled={disabled || saving}
                onClick={onSkip}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-amber-500/40 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("exerciseExecution.skip")}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {showNotes ? (
        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("exerciseExecution.exerciseNotes")}</span>
          <textarea
            value={executionNotes ?? ""}
            disabled={disabled || saving}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={2}
            placeholder={t("exerciseExecution.notesPlaceholder")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm leading-relaxed text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          />
        </label>
      ) : null}

      {saving ? <p className="mt-2 text-xs text-blue-300">{t("exerciseExecution.saving")}</p> : null}
    </li>
  );
}
