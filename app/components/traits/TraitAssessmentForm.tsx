"use client";

import { useState, useTransition } from "react";
import { submitTraitAssessment } from "@/app/actions/traits";
import { getTraitsByCategory } from "@/app/lib/traits/constants";
import TraitScoringGuide from "@/app/components/traits/TraitScoringGuide";
import {
  TraitAssessmentConfidence,
  TraitKey,
} from "@/app/types/traits";

type Props = {
  pedigreeHorseId: string;
  horseName: string;
  initialSourceLabel?: string | null;
};

export default function TraitAssessmentForm({ pedigreeHorseId, horseName, initialSourceLabel }: Props) {
  const [traitKey, setTraitKey] = useState<TraitKey>("rideability");
  const [score, setScore] = useState(3);
  const [confidence, setConfidence] = useState<TraitAssessmentConfidence>("medium");
  const [sourceNote, setSourceNote] = useState("");
  const sourceLabel = initialSourceLabel ?? "Owner/Breeder reported";
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const grouped = getTraitsByCategory();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await submitTraitAssessment({
        pedigreeHorseId,
        traitKey,
        score,
        confidence,
        sourceNote,
      });
      if (result.success) {
        setMessage("Assessment submitted. It is not automatically verified and will be aggregated with other evidence.");
        setSourceNote("");
      } else {
        setMessage(result.error ?? "Submission failed.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Trait Evidence Submission</p>
        <h3 className="mt-2 text-xl font-bold text-white">Add assessment for {horseName}</h3>
        <p className="mt-2 text-sm text-gray-400">
          Source classification: <span className="text-gray-200">{sourceLabel}</span>. Submissions are never
          auto-verified. Admins may review evidence separately.
        </p>
      </div>

      <label className="block text-sm text-gray-300">
        Trait category & trait
        <select
          value={traitKey}
          onChange={(event) => setTraitKey(event.target.value as TraitKey)}
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
        Your confidence in this assessment
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
        Source note (optional, private to managers/admins)
        <textarea
          value={sourceNote}
          onChange={(event) => setSourceNote(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
          placeholder="e.g. observed in training, breeder evaluation, competition context"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit Assessment"}
      </button>

      {message ? <p className="text-sm text-gray-300">{message}</p> : null}
    </form>
  );
}
