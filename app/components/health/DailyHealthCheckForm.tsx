"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveDailyHealthCheck } from "@/app/actions/health";
import { todayIsoDate } from "@/app/lib/health/format";
import type {
  DailyHealthCheckInput,
  HealthCheck,
  HealthCheckAppetite,
  HealthCheckAttitude,
  HealthCheckHydration,
  HealthCheckManure,
} from "@/app/types/health";

type Props = {
  pedigreeHorseId: string;
  existingCheck?: HealthCheck | null;
  onSaved?: () => void;
};

const APPETITE_OPTIONS: HealthCheckAppetite[] = ["good", "reduced", "poor"];
const HYDRATION_OPTIONS: HealthCheckHydration[] = ["good", "low"];
const ATTITUDE_OPTIONS: HealthCheckAttitude[] = ["normal", "dull", "anxious"];
const MANURE_OPTIONS: HealthCheckManure[] = ["normal", "loose", "none"];

export default function DailyHealthCheckForm({
  pedigreeHorseId,
  existingCheck,
  onSaved,
}: Props) {
  const t = useTranslations("health");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    checkDate: existingCheck?.checkDate ?? todayIsoDate(),
    temperatureCelsius: existingCheck?.temperatureCelsius?.toString() ?? "",
    appetite: existingCheck?.appetite ?? "",
    hydration: existingCheck?.hydration ?? "",
    attitude: existingCheck?.attitude ?? "",
    manure: existingCheck?.manure ?? "",
    lamenessObserved: existingCheck?.lamenessObserved ?? false,
    lamenessNotes: existingCheck?.lamenessNotes ?? "",
    feverObserved: existingCheck?.feverObserved ?? false,
    notes: existingCheck?.notes ?? "",
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const input: DailyHealthCheckInput = {
      pedigreeHorseId,
      checkDate: form.checkDate,
      temperatureCelsius: form.temperatureCelsius ? Number(form.temperatureCelsius) : null,
      appetite: (form.appetite as HealthCheckAppetite) || null,
      hydration: (form.hydration as HealthCheckHydration) || null,
      attitude: (form.attitude as HealthCheckAttitude) || null,
      manure: (form.manure as HealthCheckManure) || null,
      lamenessObserved: form.lamenessObserved,
      lamenessNotes: form.lamenessNotes || null,
      feverObserved: form.feverObserved,
      notes: form.notes || null,
    };

    startTransition(async () => {
      const result = await saveDailyHealthCheck(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(existingCheck ? t("form.updatedMessage") : t("form.savedMessage"));
      onSaved?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm text-gray-400">{t("form.checkDate")}</span>
          <input
            type="date"
            value={form.checkDate}
            onChange={(event) => setForm((current) => ({ ...current, checkDate: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-gray-400">{t("form.temperature")}</span>
          <input
            type="number"
            step="0.1"
            min="35"
            max="42"
            value={form.temperatureCelsius}
            onChange={(event) =>
              setForm((current) => ({ ...current, temperatureCelsius: event.target.value }))
            }
            placeholder={t("form.temperaturePlaceholder")}
            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-2">
          <span className="text-sm text-gray-400">{t("form.appetite")}</span>
          <select
            value={form.appetite}
            onChange={(event) => setForm((current) => ({ ...current, appetite: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white"
          >
            <option value="">{t("form.notRecorded")}</option>
            {APPETITE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`form.options.appetite.${option}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-gray-400">{t("form.hydration")}</span>
          <select
            value={form.hydration}
            onChange={(event) => setForm((current) => ({ ...current, hydration: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white"
          >
            <option value="">{t("form.notRecorded")}</option>
            {HYDRATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`form.options.hydration.${option}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-gray-400">{t("form.attitude")}</span>
          <select
            value={form.attitude}
            onChange={(event) => setForm((current) => ({ ...current, attitude: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white"
          >
            <option value="">{t("form.notRecorded")}</option>
            {ATTITUDE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`form.options.attitude.${option}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-gray-400">{t("form.manure")}</span>
          <select
            value={form.manure}
            onChange={(event) => setForm((current) => ({ ...current, manure: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white"
          >
            <option value="">{t("form.notRecorded")}</option>
            {MANURE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`form.options.manure.${option}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3">
          <input
            type="checkbox"
            checked={form.feverObserved}
            onChange={(event) =>
              setForm((current) => ({ ...current, feverObserved: event.target.checked }))
            }
            className="h-4 w-4"
          />
          <span className="text-sm text-white">{t("form.feverObserved")}</span>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3">
          <input
            type="checkbox"
            checked={form.lamenessObserved}
            onChange={(event) =>
              setForm((current) => ({ ...current, lamenessObserved: event.target.checked }))
            }
            className="h-4 w-4"
          />
          <span className="text-sm text-white">{t("form.lamenessObserved")}</span>
        </label>
      </div>

      {form.lamenessObserved ? (
        <label className="block space-y-2">
          <span className="text-sm text-gray-400">{t("form.lamenessNotes")}</span>
          <textarea
            value={form.lamenessNotes}
            onChange={(event) =>
              setForm((current) => ({ ...current, lamenessNotes: event.target.value }))
            }
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white"
            placeholder={t("form.lamenessNotesPlaceholder")}
          />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm text-gray-400">{t("form.generalNotes")}</span>
        <textarea
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white"
          placeholder={t("form.generalNotesPlaceholder")}
        />
      </label>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {isPending
          ? t("form.saving")
          : existingCheck
            ? t("form.updateHealthCheck")
            : t("form.saveDailyHealthCheck")}
      </button>
    </form>
  );
}
