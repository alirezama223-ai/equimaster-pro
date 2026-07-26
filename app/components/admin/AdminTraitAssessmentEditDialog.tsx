"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateTraitAssessment } from "@/app/actions/traits";
import TraitScoringGuide from "@/app/components/traits/TraitScoringGuide";
import { getTraitsByCategory } from "@/app/lib/traits/constants";
import {
  SOURCE_TYPE_DESCRIPTIONS,
  formatSourceType,
} from "@/app/lib/traits/evidence-labels";
import { getEditableSourceTypesForTrait } from "@/app/lib/traits/validation";
import {
  TraitAssessmentConfidence,
  TraitKey,
  TraitSourceType,
} from "@/app/types/traits";

export type AdminTraitAssessmentEditRow = {
  id: string;
  horseName: string;
  trait_key: string;
  score: number;
  confidence: TraitAssessmentConfidence;
  source_type: TraitSourceType;
  source_note: string | null;
  verified: boolean;
};

type Props = {
  row: AdminTraitAssessmentEditRow | null;
  onClose: () => void;
};

function AdminTraitAssessmentEditForm({
  row,
  onClose,
}: {
  row: AdminTraitAssessmentEditRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [traitKey, setTraitKey] = useState<TraitKey>(row.trait_key as TraitKey);
  const [score, setScore] = useState(Number(row.score));
  const [confidence, setConfidence] = useState<TraitAssessmentConfidence>(row.confidence);
  const [sourceType, setSourceType] = useState<TraitSourceType>(row.source_type);
  const [sourceNote, setSourceNote] = useState(row.source_note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const grouped = getTraitsByCategory();
  const allowedSources = getEditableSourceTypesForTrait(traitKey, row.source_type);
  const effectiveSourceType = allowedSources.includes(sourceType)
    ? sourceType
    : (allowedSources[0] ?? "admin_assessed");

  function handleTraitChange(nextTrait: TraitKey) {
    setTraitKey(nextTrait);
    const nextSources = getEditableSourceTypesForTrait(nextTrait, row.source_type);
    if (!nextSources.includes(sourceType)) {
      setSourceType(nextSources[0] ?? "admin_assessed");
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await adminUpdateTraitAssessment({
        assessmentId: row.id,
        traitKey,
        score,
        confidence,
        sourceType: effectiveSourceType,
        sourceNote,
      });

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setMessage(result.error ?? "Update failed.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <label className="block text-sm text-gray-300">
        Trait
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
        <p className="text-sm text-gray-300">Score (1–5)</p>
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
        Confidence
        <select
          value={confidence}
          onChange={(event) => setConfidence(event.target.value as TraitAssessmentConfidence)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>

      <label className="block text-sm text-gray-300">
        Evidence source type
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
        Source note
        <textarea
          value={sourceNote}
          onChange={(event) => setSourceNote(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-gray-300"
        >
          Cancel
        </button>
      </div>

      {message ? <p className="text-sm text-red-300">{message}</p> : null}
    </form>
  );
}

export default function AdminTraitAssessmentEditDialog({ row, onClose }: Props) {
  if (!row) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-trait-edit-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Edit Assessment</p>
            <h3 id="admin-trait-edit-title" className="mt-2 text-xl font-bold text-white">
              {row.horseName}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Verified status is changed separately. Identity fields (horse, author) are not editable here.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:text-white"
          >
            Close
          </button>
        </div>

        <AdminTraitAssessmentEditForm key={row.id} row={row} onClose={onClose} />
      </div>
    </div>
  );
}
