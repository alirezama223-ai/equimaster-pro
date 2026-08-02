"use client";

import { useTranslations } from "next-intl";
import type { CoachNoteEntry } from "@/app/types/training-analytics";

type Props = {
  notes: CoachNoteEntry[];
};

export default function HorseCoachNotesList({ notes }: Props) {
  const t = useTranslations("training");

  if (notes.length === 0) {
    return <p className="text-sm text-gray-400">{t("analytics.coachNotesEmpty")}</p>;
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="rounded-2xl border border-white/10 bg-[#08111F] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold text-white">{note.title}</p>
            <span className="text-xs text-gray-500">{note.dateLabel}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-300">{note.coachNotes}</p>
        </li>
      ))}
    </ul>
  );
}
