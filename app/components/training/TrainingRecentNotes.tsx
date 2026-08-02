import type { TrainingRecentNote } from "@/app/types/training";

type Props = {
  notes: TrainingRecentNote[];
};

export default function TrainingRecentNotes({ notes }: Props) {
  return (
    <ul className="space-y-3">
      {notes.map((entry) => (
        <li
          key={entry.id}
          className="rounded-2xl border border-white/10 bg-[#08111F] px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">{entry.title}</p>
              <p className="mt-1 text-xs text-gray-500">{entry.dateLabel}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-300">{entry.notesPreview}</p>
        </li>
      ))}
    </ul>
  );
}
