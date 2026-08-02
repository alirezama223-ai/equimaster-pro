"use client";

import { useTranslations } from "next-intl";
import type { TrainingHorse } from "@/app/types/training";
import TrainingEmptyState from "@/app/components/training/TrainingEmptyState";

type Props = {
  horses: TrainingHorse[];
  selectedHorseId: string;
  onSelect: (horseId: string) => void;
};

export default function TrainingHorseSelector({ horses, selectedHorseId, onSelect }: Props) {
  const t = useTranslations("training");

  if (horses.length === 0) {
    return (
      <TrainingEmptyState
        title={t("empty.noHorsesTitle")}
        description={t("empty.noHorsesDescription")}
      />
    );
  }

  const selected = horses.find((horse) => horse.id === selectedHorseId) ?? horses[0];

  return (
    <div className="space-y-4">
      <label htmlFor="training-horse-select" className="block text-sm font-medium text-gray-300">
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

      {selected ? (
        <div className="rounded-2xl border border-blue-500/30 bg-[#08111F] p-4">
          <p className="text-lg font-bold text-white">{selected.name}</p>
          <p className="mt-1 text-sm text-gray-400">{selected.subtitle}</p>
        </div>
      ) : null}
    </div>
  );
}
