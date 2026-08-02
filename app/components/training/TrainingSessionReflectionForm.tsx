"use client";

import { useTranslations } from "next-intl";
import type { TrainingSessionReflection } from "@/app/types/training";

const HORSE_FEELING_OPTIONS = [
  "Relaxed",
  "Focused",
  "Energetic",
  "Tense",
  "Tired",
  "Spooky",
  "Strong",
  "Flat",
] as const;

type Props = {
  value: TrainingSessionReflection;
  onChange: (next: TrainingSessionReflection) => void;
  disabled?: boolean;
};

export default function TrainingSessionReflectionForm({ value, onChange, disabled }: Props) {
  const t = useTranslations("training");

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("reflection.riderRating")}</span>
        <div className="mt-3 flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={value.riderRating ?? 5}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, riderRating: Number(event.target.value) })
            }
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-blue-500 disabled:opacity-50"
          />
          <span className="w-8 text-center text-lg font-bold text-white">{value.riderRating ?? 5}</span>
        </div>
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("reflection.horseFeeling")}</span>
        <select
          value={value.horseFeeling ?? ""}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, horseFeeling: event.target.value || null })
          }
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
        >
          <option value="">{t("reflection.selectHorseFeeling")}</option>
          {HORSE_FEELING_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`reflection.feelings.${option}` as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("reflection.coachNotes")}</span>
        <textarea
          value={value.coachNotes ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, coachNotes: event.target.value })}
          rows={3}
          placeholder={t("reflection.coachNotesPlaceholder")}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm leading-relaxed text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("reflection.overallNotes")}</span>
        <textarea
          value={value.notes ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
          rows={4}
          placeholder={t("reflection.overallNotesPlaceholder")}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm leading-relaxed text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
        />
      </label>
    </div>
  );
}
