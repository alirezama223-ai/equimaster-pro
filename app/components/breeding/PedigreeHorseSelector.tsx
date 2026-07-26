"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { getBreedingCandidateById, searchBreedingCandidates } from "@/app/actions/breeding";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { formatPedigreeIdentityLine, formatPedigreeSexLabel } from "@/app/lib/pedigree";
import { BreedingCandidate } from "@/app/types/breeding";

type Props = {
  label: string;
  sex: "mare" | "stallion";
  selected: BreedingCandidate | null;
  onSelect: (candidate: BreedingCandidate | null) => void;
  initialId?: string | null;
};

export default function PedigreeHorseSelector({
  label,
  sex,
  selected,
  onSelect,
  initialId,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BreedingCandidate[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!initialId || selected?.id === initialId) return;

    startTransition(async () => {
      const response = await getBreedingCandidateById(initialId);
      if (response.candidate) {
        onSelect(response.candidate);
      }
    });
  }, [initialId, onSelect, selected?.id]);

  function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    startTransition(async () => {
      const response = await searchBreedingCandidates({ query: value.trim(), sex });
      setResults(response.candidates);
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6 h-full flex flex-col">
      <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{label}</p>
      <h2 className="mt-2 text-2xl font-bold text-white">
        {sex === "mare" ? "Select Mare" : "Select Stallion"}
      </h2>
      <p className="mt-2 text-sm text-gray-400">
        Search by name, studbook, or registration. Horses are matched by pedigree UUID, never by
        name alone.
      </p>

      <input
        type="text"
        value={query}
        onChange={(event) => handleSearch(event.target.value)}
        placeholder={sex === "mare" ? "Search mares..." : "Search stallions..."}
        className="mt-5 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
      />

      {selected ? (
        <div className="mt-5 rounded-2xl border border-blue-500/30 bg-[#08111F] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold text-white">{selected.name}</p>
                {selected.verified ? <VerifiedBadge /> : null}
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {formatPedigreeIdentityLine({
                  name: selected.name,
                  birthYear: selected.birthYear,
                  sex: selected.sex,
                  studbook: selected.studbook,
                  sireName: selected.sireName,
                  damSireName: selected.damSireName,
                })}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {formatPedigreeSexLabel(selected.sex)}
                {selected.registrationNumber ? ` · ${selected.registrationNumber}` : ""}
                {!selected.verified ? " · Unverified pedigree record" : ""}
              </p>
              {selected.source === "stallion_directory" && selected.sourceId ? (
                <Link
                  href={`/stallions/${selected.sourceId}`}
                  className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
                >
                  View Stallion Directory profile →
                </Link>
              ) : selected.source === "listing" && selected.sourceId ? (
                <Link
                  href={`/horse/${selected.sourceId}`}
                  className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
                >
                  View Marketplace listing →
                </Link>
              ) : (
                <Link
                  href={`/pedigree/${selected.id}`}
                  className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
                >
                  View pedigree profile →
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-80">
        {pending ? <p className="text-sm text-gray-500">Searching...</p> : null}
        {!pending && query.trim().length >= 2 && results.length === 0 ? (
          <p className="text-sm text-gray-500">No matching pedigree records found.</p>
        ) : null}
        {results.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            onClick={() => {
              onSelect(candidate);
              setResults([]);
              setQuery("");
            }}
            className="w-full rounded-2xl border border-white/10 bg-[#08111F] p-4 text-left hover:border-blue-500/40 transition"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-white">{candidate.name}</span>
              {candidate.verified ? <VerifiedBadge className="scale-90" /> : null}
            </div>
            <p className="mt-2 text-sm text-gray-400">
              {formatPedigreeIdentityLine({
                name: candidate.name,
                birthYear: candidate.birthYear,
                sex: candidate.sex,
                studbook: candidate.studbook,
                sireName: candidate.sireName,
                damSireName: candidate.damSireName,
              })}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {candidate.source === "stallion_directory"
                ? "Stallion Directory · "
                : candidate.source === "listing"
                  ? "Marketplace listing · "
                  : ""}
              {candidate.verified ? "Verified record" : "Unverified record"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
