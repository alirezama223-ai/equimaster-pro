"use client";

import { FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createTrainingHorseAction } from "@/app/actions/training-horses";
import type { TrainingHorse } from "@/app/types/training";

type Props = {
  onCreated: (horse: TrainingHorse) => void;
  onCancel: () => void;
};

export default function TrainingAddHorseForm({ onCreated, onCancel }: Props) {
  const t = useTranslations("trainingAddHorse");
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"stallion" | "mare" | "gelding" | "unknown">("unknown");
  const [birthYear, setBirthYear] = useState("");
  const [breed, setBreed] = useState("");
  const [studbook, setStudbook] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [color, setColor] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startSaving(async () => {
      const result = await createTrainingHorseAction({
        name,
        sex,
        birthYear: birthYear ? Number(birthYear) : null,
        breed,
        studbook,
        registrationNumber,
        color,
        country,
      });

      if (result.error || !result.horse) {
        setError(result.error ?? t("errors.createFailed"));
        return;
      }

      window.location.assign(`${window.location.pathname}?horseId=${result.horse.id}`);
      onCreated(result.horse);
    });
  }

  const inputClassName =
    "w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-blue-400/60";
  const labelClassName = "mb-1.5 block text-xs font-medium text-gray-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-blue-500/20 bg-[#07101d] p-4 sm:p-5">
      <div>
        <p className="text-base font-semibold text-white">{t("title")}</p>
        <p className="mt-1 text-sm text-gray-400">{t("description")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="training-add-horse-name" className={labelClassName}>{t("fields.name")}</label>
          <input id="training-add-horse-name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("fields.namePlaceholder")} className={inputClassName} />
        </div>

        <div>
          <label htmlFor="training-add-horse-sex" className={labelClassName}>{t("fields.sex")}</label>
          <select id="training-add-horse-sex" value={sex} onChange={(event) => setSex(event.target.value as typeof sex)} className={inputClassName}>
            <option value="unknown">{t("sex.unknown")}</option>
            <option value="mare">{t("sex.mare")}</option>
            <option value="stallion">{t("sex.stallion")}</option>
            <option value="gelding">{t("sex.gelding")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="training-add-horse-birth-year" className={labelClassName}>{t("fields.birthYear")}</label>
          <input id="training-add-horse-birth-year" type="number" min={1970} max={new Date().getFullYear()} value={birthYear} onChange={(event) => setBirthYear(event.target.value)} placeholder={t("fields.birthYearPlaceholder")} className={inputClassName} />
        </div>

        <div>
          <label htmlFor="training-add-horse-breed" className={labelClassName}>{t("fields.breed")}</label>
          <input id="training-add-horse-breed" maxLength={120} value={breed} onChange={(event) => setBreed(event.target.value)} className={inputClassName} />
        </div>

        <div>
          <label htmlFor="training-add-horse-studbook" className={labelClassName}>{t("fields.studbook")}</label>
          <input id="training-add-horse-studbook" maxLength={120} value={studbook} onChange={(event) => setStudbook(event.target.value)} className={inputClassName} />
        </div>

        <div>
          <label htmlFor="training-add-horse-registration" className={labelClassName}>{t("fields.registrationNumber")}</label>
          <input id="training-add-horse-registration" maxLength={120} value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} className={inputClassName} />
        </div>

        <div>
          <label htmlFor="training-add-horse-color" className={labelClassName}>{t("fields.color")}</label>
          <input id="training-add-horse-color" maxLength={80} value={color} onChange={(event) => setColor(event.target.value)} className={inputClassName} />
        </div>

        <div>
          <label htmlFor="training-add-horse-country" className={labelClassName}>{t("fields.country")}</label>
          <input id="training-add-horse-country" maxLength={80} value={country} onChange={(event) => setCountry(event.target.value)} className={inputClassName} />
        </div>
      </div>

      {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 disabled:opacity-50">
          {t("actions.cancel")}
        </button>
        <button type="submit" disabled={saving || !name.trim()} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? t("actions.saving") : t("actions.save")}
        </button>
      </div>
    </form>
  );
}
