"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  searchAdminPedigreeHorsesForTraits,
  submitAdminTraitAssessment,
} from "@/app/actions/traits";
import TraitScoringGuide from "@/app/components/traits/TraitScoringGuide";
import { getTraitsByCategory } from "@/app/lib/traits/constants";
import {
  SOURCE_TYPE_DESCRIPTIONS,
  formatSourceType,
} from "@/app/lib/traits/evidence-labels";
import { getAllowedAdminSourceTypesForTrait, isUuid } from "@/app/lib/traits/validation";
import {
  TraitAssessmentConfidence,
  TraitKey,
  TraitSourceType,
} from "@/app/types/traits";

type SelectedHorse = {
  id: string;
  name: string;
  sex: string | null;
};

export default function AdminTraitAssessmentForm() {
  const t = useTranslations("admin.traits");
  const router = useRouter();
  const [horseQuery, setHorseQuery] = useState("");
  const [horseResults, setHorseResults] = useState<SelectedHorse[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<SelectedHorse | null>(null);
  const [manualHorseId, setManualHorseId] = useState("");
  const [traitKey, setTraitKey] = useState<TraitKey>("rideability");
  const [score, setScore] = useState(3);
  const [confidence, setConfidence] = useState<TraitAssessmentConfidence>("medium");
  const [sourceType, setSourceType] = useState<TraitSourceType>("admin_assessed");
  const [sourceNote, setSourceNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const searchTimeoutRef = useRef<number | null>(null);

  const grouped = getTraitsByCategory();
  const allowedSources = getAllowedAdminSourceTypesForTrait(traitKey);
  const effectiveSourceType = allowedSources.includes(sourceType)
    ? sourceType
    : (allowedSources[0] ?? "admin_assessed");
  const pedigreeHorseId = selectedHorse?.id ?? (isUuid(manualHorseId) ? manualHorseId : null);

  function handleTraitChange(nextTrait: TraitKey) {
    setTraitKey(nextTrait);
    const nextSources = getAllowedAdminSourceTypesForTrait(nextTrait);
    if (!nextSources.includes(sourceType)) {
      setSourceType(nextSources[0] ?? "admin_assessed");
    }
  }

  function handleHorseQueryChange(value: string) {
    setHorseQuery(value);
    if (value.trim().length < 2) {
      setHorseResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      startTransition(async () => {
        const result = await searchAdminPedigreeHorsesForTraits(value);
        setHorseResults(result.horses);
      });
    }, 300);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!pedigreeHorseId) {
      setMessage(t("selectHorseError"));
      return;
    }

    startTransition(async () => {
      const result = await submitAdminTraitAssessment({
        pedigreeHorseId,
        traitKey,
        score,
        confidence,
        sourceType: effectiveSourceType,
        sourceNote,
      });

      if (result.success) {
        setMessage(t("assessmentRecorded"));
        setSourceNote("");
        router.refresh();
      } else {
        setMessage(result.error ?? t("submissionFailed"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{t("formEyebrow")}</p>
        <h3 className="mt-2 text-xl font-bold text-white">{t("formTitle")}</h3>
        <p className="mt-2 text-sm text-gray-400">{t("formSubtitle")}</p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm text-gray-300">
          {t("searchHorse")}
          <input
            value={horseQuery}
            onChange={(event) => handleHorseQueryChange(event.target.value)}
            placeholder={t("searchHorsePlaceholder")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
          />
        </label>

        {horseResults.length > 0 ? (
          <ul className="rounded-xl border border-white/10 bg-[#08111F] divide-y divide-white/5">
            {horseResults.map((horse) => (
              <li key={horse.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHorse(horse);
                    setManualHorseId(horse.id);
                    setHorseQuery("");
                    setHorseResults([]);
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-gray-200 hover:bg-white/5"
                >
                  <span>
                    {horse.name}
                    {horse.sex ? ` · ${horse.sex}` : ""}
                  </span>
                  <span className="text-xs text-gray-500">{horse.id.slice(0, 8)}…</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <label className="block text-sm text-gray-300">
          {t("orHorseUuid")}
          <input
            value={manualHorseId}
            onChange={(event) => {
              setManualHorseId(event.target.value);
              setSelectedHorse(null);
            }}
            placeholder={t("horseIdPlaceholder")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
          />
        </label>

        {selectedHorse ? (
          <p className="text-sm text-emerald-300">
            {t("selectedHorse", { name: selectedHorse.name, id: selectedHorse.id })}
          </p>
        ) : pedigreeHorseId ? (
          <p className="text-sm text-gray-400">{t("usingPedigreeId", { id: pedigreeHorseId })}</p>
        ) : null}
      </div>

      <label className="block text-sm text-gray-300">
        {t("traitLabel")}
        <select
          value={traitKey}
          onChange={(event) => handleTraitChange(event.target.value as TraitKey)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
        >
          {[...grouped.entries()].map(([category, traits]) => (
            <optgroup key={category} label={traits[0]?.categoryLabel ?? category}>
              {traits.map((trait) => (
                <option key={trait.key} value={trait.key}>
                  {trait.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <TraitScoringGuide traitKey={traitKey} />

      <div>
        <p className="text-sm text-gray-300">{t("scoreLabel")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScore(value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                score === value ? "bg-blue-600 text-white" : "border border-white/10 text-gray-300"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <label className="block text-sm text-gray-300">
        {t("confidenceLabel")}
        <select
          value={confidence}
          onChange={(event) => setConfidence(event.target.value as TraitAssessmentConfidence)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
        >
          <option value="low">{t("confidenceLow")}</option>
          <option value="medium">{t("confidenceMedium")}</option>
          <option value="high">{t("confidenceHigh")}</option>
        </select>
      </label>

      <label className="block text-sm text-gray-300">
        {t("sourceTypeLabel")}
        <select
          value={effectiveSourceType}
          onChange={(event) => setSourceType(event.target.value as TraitSourceType)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
        >
          {allowedSources.map((item) => (
            <option key={item} value={item}>
              {formatSourceType(item)}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-gray-500">{SOURCE_TYPE_DESCRIPTIONS[effectiveSourceType]}</p>

      <label className="block text-sm text-gray-300">
        {t("sourceNoteLabel")}
        <textarea
          value={sourceNote}
          onChange={(event) => setSourceNote(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
          placeholder={t("sourceNotePlaceholder")}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? t("saving") : t("addAssessment")}
      </button>

      {message ? <p className="text-sm text-gray-300">{message}</p> : null}
    </form>
  );
}
