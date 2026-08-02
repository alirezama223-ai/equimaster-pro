"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  createFarrierVisit,
  createHorseInjury,
  createVaccination,
  resolveHorseInjury,
} from "@/app/actions/health";
import { todayIsoDate } from "@/app/lib/health/format";
import type { FarrierVisit, HorseInjury, InjurySeverity, Vaccination } from "@/app/types/health";

type Props = {
  pedigreeHorseId: string;
  injuries: HorseInjury[];
  farrierVisits: FarrierVisit[];
  vaccinations: Vaccination[];
  onChanged?: () => void;
};

const FORM_KEYS = ["injury", "farrier", "vaccination"] as const;
type FormKey = (typeof FORM_KEYS)[number];

const ADD_LABEL_KEYS: Record<FormKey, "addInjury" | "addFarrier" | "addVaccination"> = {
  injury: "addInjury",
  farrier: "addFarrier",
  vaccination: "addVaccination",
};

export default function HorseHealthRecordsPanel({
  pedigreeHorseId,
  injuries,
  farrierVisits,
  vaccinations,
  onChanged,
}: Props) {
  const t = useTranslations("health");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<FormKey | null>(null);

  const [injuryForm, setInjuryForm] = useState({
    injuryDate: todayIsoDate(),
    bodyArea: "",
    severity: "mild" as InjurySeverity,
    description: "",
  });

  const [farrierForm, setFarrierForm] = useState({
    visitDate: todayIsoDate(),
    nextDueDate: "",
    workDone: "",
  });

  const [vaccinationForm, setVaccinationForm] = useState({
    vaccineName: "",
    administeredDate: todayIsoDate(),
    nextDueDate: "",
  });

  function runAction(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      setActiveForm(null);
      onChanged?.();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FORM_KEYS.map((formKey) => (
          <button
            key={formKey}
            type="button"
            onClick={() => setActiveForm(activeForm === formKey ? null : formKey)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            {t(`records.${ADD_LABEL_KEYS[formKey]}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {activeForm === "injury" ? (
        <form
          className="grid gap-3 rounded-2xl border border-white/10 bg-[#0f172a] p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            runAction(() =>
              createHorseInjury({
                pedigreeHorseId,
                injuryDate: injuryForm.injuryDate,
                bodyArea: injuryForm.bodyArea,
                severity: injuryForm.severity,
                description: injuryForm.description,
              })
            );
          }}
        >
          <input type="date" value={injuryForm.injuryDate} onChange={(e) => setInjuryForm({ ...injuryForm, injuryDate: e.target.value })} className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white" />
          <input value={injuryForm.bodyArea} onChange={(e) => setInjuryForm({ ...injuryForm, bodyArea: e.target.value })} placeholder={t("records.bodyArea")} required className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white" />
          <select value={injuryForm.severity} onChange={(e) => setInjuryForm({ ...injuryForm, severity: e.target.value as InjurySeverity })} className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white">
            <option value="mild">{t("records.severity.mild")}</option>
            <option value="moderate">{t("records.severity.moderate")}</option>
            <option value="severe">{t("records.severity.severe")}</option>
          </select>
          <input value={injuryForm.description} onChange={(e) => setInjuryForm({ ...injuryForm, description: e.target.value })} placeholder={t("records.description")} className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white" />
          <button type="submit" disabled={isPending} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white sm:col-span-2">{t("records.saveInjury")}</button>
        </form>
      ) : null}

      {activeForm === "farrier" ? (
        <form
          className="grid gap-3 rounded-2xl border border-white/10 bg-[#0f172a] p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            runAction(() =>
              createFarrierVisit({
                pedigreeHorseId,
                visitDate: farrierForm.visitDate,
                nextDueDate: farrierForm.nextDueDate || null,
                workDone: farrierForm.workDone,
              })
            );
          }}
        >
          <input type="date" value={farrierForm.visitDate} onChange={(e) => setFarrierForm({ ...farrierForm, visitDate: e.target.value })} className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white" />
          <input type="date" value={farrierForm.nextDueDate} onChange={(e) => setFarrierForm({ ...farrierForm, nextDueDate: e.target.value })} className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white" />
          <input value={farrierForm.workDone} onChange={(e) => setFarrierForm({ ...farrierForm, workDone: e.target.value })} placeholder={t("records.workDone")} className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white sm:col-span-2" />
          <button type="submit" disabled={isPending} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white sm:col-span-2">{t("records.saveFarrierVisit")}</button>
        </form>
      ) : null}

      {activeForm === "vaccination" ? (
        <form
          className="grid gap-3 rounded-2xl border border-white/10 bg-[#0f172a] p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            runAction(() =>
              createVaccination({
                pedigreeHorseId,
                vaccineName: vaccinationForm.vaccineName,
                administeredDate: vaccinationForm.administeredDate,
                nextDueDate: vaccinationForm.nextDueDate || null,
              })
            );
          }}
        >
          <input value={vaccinationForm.vaccineName} onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineName: e.target.value })} placeholder={t("records.vaccineName")} required className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white" />
          <input type="date" value={vaccinationForm.administeredDate} onChange={(e) => setVaccinationForm({ ...vaccinationForm, administeredDate: e.target.value })} className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white" />
          <input type="date" value={vaccinationForm.nextDueDate} onChange={(e) => setVaccinationForm({ ...vaccinationForm, nextDueDate: e.target.value })} className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-white sm:col-span-2" />
          <button type="submit" disabled={isPending} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white sm:col-span-2">{t("records.saveVaccination")}</button>
        </form>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">{t("records.injuriesSection")}</h4>
        {injuries.length === 0 ? (
          <p className="text-sm text-gray-400">{t("records.noInjuries")}</p>
        ) : (
          injuries.slice(0, 5).map((injury) => (
            <div key={injury.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3">
              <div>
                <p className="font-medium text-white">{injury.bodyArea}</p>
                <p className="text-sm text-gray-400">
                  {injury.injuryDateLabel} · {t(`records.severity.${injury.severity}` as Parameters<typeof t>[0])} · {t(`records.injuryStatus.${injury.status}` as Parameters<typeof t>[0])}
                </p>
              </div>
              {injury.status !== "resolved" ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runAction(() => resolveHorseInjury(injury.id, pedigreeHorseId))}
                  className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-200"
                >
                  {t("records.markResolved")}
                </button>
              ) : null}
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">{t("records.farrierSection")}</h4>
        {farrierVisits.length === 0 ? (
          <p className="text-sm text-gray-400">{t("records.noFarrierVisits")}</p>
        ) : (
          farrierVisits.slice(0, 5).map((visit) => (
            <div key={visit.id} className="rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3">
              <p className="font-medium text-white">{visit.visitDateLabel}</p>
              <p className="text-sm text-gray-400">
                {t("records.nextDue", { date: visit.nextDueDateLabel ?? t("summary.notSet") })}
                {visit.workDone ? ` · ${visit.workDone}` : ""}
              </p>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">{t("records.vaccinationsSection")}</h4>
        {vaccinations.length === 0 ? (
          <p className="text-sm text-gray-400">{t("records.noVaccinations")}</p>
        ) : (
          vaccinations.slice(0, 5).map((vaccination) => (
            <div key={vaccination.id} className="rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3">
              <p className="font-medium text-white">{vaccination.vaccineName}</p>
              <p className="text-sm text-gray-400">
                {t("records.givenOn", { date: vaccination.administeredDateLabel })}
                {vaccination.nextDueDateLabel ? ` · ${t("records.dueOn", { date: vaccination.nextDueDateLabel })}` : ""}
              </p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
