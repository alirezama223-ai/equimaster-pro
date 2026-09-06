"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { TrainingHorse } from "@/app/types/training";
import TrainingEmptyState from "@/app/components/training/TrainingEmptyState";
import TrainingAddHorseForm from "@/app/components/training/TrainingAddHorseForm";

type Props = {
  horses: TrainingHorse[];
  selectedHorseId: string;
  onSelect: (horseId: string) => void;
};

export default function TrainingHorseSelector({ horses, selectedHorseId, onSelect }: Props) {
  const t = useTranslations("training");
  const tAdd = useTranslations("trainingAddHorse");
  const [addingHorse, setAddingHorse] = useState(false);

  if (addingHorse) {
    return (
      <TrainingAddHorseForm
        onCancel={() => setAddingHorse(false)}
        onCreated={() => setAddingHorse(false)}
      />
    );
  }

  const selected = horses.find((horse) => horse.id === selectedHorseId) ?? horses[0];

  return (
    <div className="space-y-4">
      {horses.length === 0 ? (
        <TrainingEmptyState
          title={t("empty.noHorsesTitle")}
          description={t("empty.noHorsesDescription")}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="training-horse-select" className="mb-1.5 block text-sm font-medium text-gray-300">
                {t("horseSelector.activeHorse")}
              </label>
              <select
                id="training-horse-select"
                value={selectedHorseId}
                onChange={(event) => onSelect(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
              >
                {horses.map((horse) => (
                  <option key={horse.id} value={horse.id}>
                    {horse.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setAddingHorse(true)}
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20"
            >
              + {tAdd("button.addHorse")}
            </button>
          </div>

          {selected ? (
            <div className="rounded-2xl border border-blue-500/30 bg-[#08111F] p-4">
              <p className="text-lg font-bold text-white">{selected.name}</p>
              <p className="mt-1 text-sm text-gray-400">{selected.subtitle}</p>
            </div>
          ) : null}
        </>
      )}

      {horses.length === 0 ? (
        <button
          type="button"
          onClick={() => setAddingHorse(true)}
          className="w-full rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20"
        >
          + {tAdd("button.addFirstHorse")}
        </button>
      ) : null}
    </div>
  );
}
