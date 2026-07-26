"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import RecommendationScoreBreakdownPanel from "@/app/components/breeding-recommendations/RecommendationScoreBreakdownPanel";
import { STALLION_AVAILABILITY_LABELS } from "@/app/types/stallion";
import { StallionRecommendationResult } from "@/app/types/breeding-recommendations";

type Props = {
  result: StallionRecommendationResult;
  marePedigreeId: string;
  selected: boolean;
  onToggleSelect: (pedigreeHorseId: string) => void;
  compareDisabled: boolean;
};

function riskBadgeClass(level: StallionRecommendationResult["riskLevel"]): string {
  switch (level) {
    case "high_concern":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "review":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    case "insufficient_data":
      return "border-gray-500/40 bg-gray-500/10 text-gray-300";
    default:
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  }
}

function confidenceBadgeClass(level: StallionRecommendationResult["analysisConfidence"]): string {
  switch (level) {
    case "high":
      return "text-emerald-300";
    case "moderate":
      return "text-amber-200";
    default:
      return "text-orange-300";
  }
}

export default function RecommendationResultCard({
  result,
  marePedigreeId,
  selected,
  onToggleSelect,
  compareDisabled,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const { candidate } = result;
  const breedingLabUrl = `/breeding-lab?mare=${marePedigreeId}&stallion=${candidate.pedigreeHorseId}`;

  return (
    <article className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-[#08111F] lg:h-44 lg:w-56">
          <Image
            src={candidate.coverImageUrl}
            alt={candidate.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 224px"
          />
          <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-sm font-bold text-white">
            #{result.rank}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-bold text-white">{candidate.name}</h3>
                {candidate.verified ? <VerifiedBadge /> : null}
                {candidate.availability === "limited" ? (
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
                    Limited
                  </span>
                ) : null}
                {candidate.availability === "booked" || candidate.availability === "retired" ? (
                  <span className="rounded-full border border-gray-500/40 bg-gray-500/10 px-2 py-0.5 text-xs font-semibold text-gray-300">
                    {STALLION_AVAILABILITY_LABELS[candidate.availability]}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {candidate.breed}
                {candidate.studbook ? ` · ${candidate.studbook}` : ""}
                {candidate.birthYear ? ` · ${candidate.birthYear}` : ""}
                {` · ${candidate.country}`}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {candidate.discipline} · {candidate.studFeeLabel}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-500">Compatibility Score</p>
              {result.compatibilityScore !== null ? (
                <>
                  <p className="text-4xl font-black text-blue-400">{result.compatibilityScore}</p>
                  <p className="text-xs text-gray-500">Based on available pedigree data</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-gray-300">Insufficient Data</p>
                  <p className="text-xs text-gray-500">N/A — pedigree evidence too limited</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClass(result.riskLevel)}`}>
              {result.riskLabel}
            </span>
            <span className={`rounded-full border border-white/10 px-3 py-1 text-xs font-semibold ${confidenceBadgeClass(result.analysisConfidence)}`}>
              Analysis Confidence: {result.analysisConfidenceLabel}
            </span>
          </div>

          {result.warnings.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm text-amber-200">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4">
            <p className="text-sm font-semibold text-white">Why this match?</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-300">
              {result.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={selected}
                disabled={compareDisabled && !selected}
                onChange={() => onToggleSelect(candidate.pedigreeHorseId)}
                className="rounded border-white/20 bg-[#08111F]"
              />
              Compare
            </label>
            <Link
              href={breedingLabUrl}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition"
            >
              Analyze Full Cross
            </Link>
            <Link
              href={`/stallions/${candidate.stallionDirectoryId}`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition"
            >
              View Stallion
            </Link>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition"
            >
              {expanded ? "Hide score breakdown" : "Score breakdown"}
            </button>
          </div>

          {expanded ? <RecommendationScoreBreakdownPanel result={result} /> : null}
        </div>
      </div>
    </article>
  );
}
