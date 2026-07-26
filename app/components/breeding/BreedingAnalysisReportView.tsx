"use client";

import Link from "next/link";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import PedigreeTree from "@/app/components/pedigree/PedigreeTree";
import {
  BREEDING_DISCLAIMER,
  BREEDING_MAX_GENERATIONS,
  GENERATION_NUMBERING_EXPLANATION,
} from "@/app/lib/breeding/constants";
import { CLOSE_RELATIONSHIP_ADVISORY } from "@/app/lib/breeding/close-relationships";
import { BreedingAnalysisReport } from "@/app/types/breeding";

type Props = {
  report: BreedingAnalysisReport;
};

export default function BreedingAnalysisReportView({ report }: Props) {
  const { structureIndicators, dataConfidence } = report;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">A. Selected Cross</p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white">
          {report.mare.name} × {report.stallion.name}
        </h2>
        <p className="mt-3 text-gray-400">
          Pedigree-based breeding decision support · {report.analyzedGenerations} generations analyzed
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <IndicatorCard label="Common ancestors" value={String(structureIndicators.commonAncestorCount)} />
          <IndicatorCard
            label="Closest shared ancestor"
            value={
              structureIndicators.closestCommonAncestorName
                ? `${structureIndicators.closestCommonAncestorName} (depth ${structureIndicators.closestCommonAncestorDepth})`
                : "None detected"
            }
          />
          <IndicatorCard
            label="Linebreeding patterns"
            value={String(structureIndicators.linebreedingPatternCount)}
          />
          <IndicatorCard
            label="Repeated bloodlines"
            value={String(structureIndicators.repeatedBloodlineCount)}
          />
          <IndicatorCard
            label="Close relationship flag"
            value={structureIndicators.closeRelationshipDetected ? "Yes" : "No"}
          />
          <IndicatorCard label="Data confidence" value={dataConfidence.label} />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#08111F] p-4 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">B. Hypothetical Foal Pedigree</p>
        <h3 className="mt-2 text-2xl font-bold text-white">Hypothetical Foal</h3>
        <p className="mt-2 text-sm text-gray-400">
          Virtual pedigree simulation only. This foal does not exist as a database record.
        </p>
        <div className="mt-6">
          <PedigreeTree
            subjectName="Hypothetical Foal"
            subjectLabel="Hypothetical Foal"
            tree={report.hypotheticalFoalTree}
            maxGenerations={BREEDING_MAX_GENERATIONS}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">C. Pedigree Completeness</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <CompletenessCard
            title="Mare"
            percent={dataConfidence.mareCompleteness.completenessPercent}
            known={dataConfidence.mareCompleteness.knownAncestorSlots}
            expected={dataConfidence.mareCompleteness.expectedAncestorSlots}
            verified={dataConfidence.mareCompleteness.verifiedAncestorCount}
          />
          <CompletenessCard
            title="Stallion"
            percent={dataConfidence.stallionCompleteness.completenessPercent}
            known={dataConfidence.stallionCompleteness.knownAncestorSlots}
            expected={dataConfidence.stallionCompleteness.expectedAncestorSlots}
            verified={dataConfidence.stallionCompleteness.verifiedAncestorCount}
          />
          <div className="rounded-2xl border border-white/10 bg-[#08111F] p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Data Confidence</p>
            <p className="mt-2 text-3xl font-black text-white">{dataConfidence.label}</p>
            <p className="mt-3 text-sm text-gray-400 leading-6">{dataConfidence.explanation}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">D. Common Ancestors</p>
        {report.commonAncestors.length === 0 ? (
          <p className="mt-4 text-gray-400">No shared ancestors detected within the analyzed depth.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {report.commonAncestors.map((ancestor) => (
              <div key={ancestor.ancestorId} className="rounded-2xl border border-white/10 bg-[#08111F] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/pedigree/${ancestor.ancestorId}`} className="text-xl font-bold text-white hover:text-blue-400">
                    {ancestor.name}
                  </Link>
                  {ancestor.verified ? <VerifiedBadge /> : null}
                  {ancestor.isRepeated ? (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                      Repeated ancestor
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <SideBlock
                    title="Stallion side"
                    closest={ancestor.stallionSide.closestGeneration}
                    count={ancestor.stallionSide.occurrenceCount}
                    generations={ancestor.stallionSide.generations}
                  />
                  <SideBlock
                    title="Mare side"
                    closest={ancestor.mareSide.closestGeneration}
                    count={ancestor.mareSide.occurrenceCount}
                    generations={ancestor.mareSide.generations}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">E. Linebreeding Patterns</p>
        <p className="mt-2 text-sm text-gray-400">{GENERATION_NUMBERING_EXPLANATION}</p>
        {report.linebreedingPatterns.length === 0 ? (
          <p className="mt-4 text-gray-400">No linebreeding patterns detected.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Ancestor</th>
                  <th className="py-2 pr-4">Notation</th>
                  <th className="py-2 pr-4">Stallion Gen</th>
                  <th className="py-2 pr-4">Mare Gen</th>
                  <th className="py-2">Severity</th>
                </tr>
              </thead>
              <tbody>
                {report.linebreedingPatterns.map((pattern) => (
                  <tr key={`${pattern.ancestorId}-${pattern.notation}`} className="border-t border-white/10">
                    <td className="py-3 pr-4">
                      <Link href={`/pedigree/${pattern.ancestorId}`} className="font-semibold text-white hover:text-blue-400">
                        {pattern.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-blue-300 font-semibold">{pattern.notation}</td>
                    <td className="py-3 pr-4">{pattern.stallionGeneration}</td>
                    <td className="py-3 pr-4">{pattern.mareGeneration}</td>
                    <td className="py-3">
                      <SeverityBadge label={pattern.severityLabel} severity={pattern.severity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">F. Close Relationship Warnings</p>
        {report.closeRelationshipWarnings.length === 0 ? (
          <p className="mt-4 text-gray-400">
            No obvious close pedigree relationships detected within the analyzed data.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {report.closeRelationshipWarnings.map((warning) => (
              <div
                key={`${warning.kind}-${warning.title}`}
                className={`rounded-2xl border p-5 ${
                  warning.severity === "critical"
                    ? "border-red-500/40 bg-red-950/20"
                    : "border-amber-500/40 bg-amber-950/20"
                }`}
              >
                <p className="text-lg font-bold text-white">{warning.title}</p>
                <p className="mt-2 text-sm text-gray-300 leading-6">{warning.explanation}</p>
              </div>
            ))}
            <p className="text-sm text-gray-400 leading-6">{CLOSE_RELATIONSHIP_ADVISORY}</p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">G. Bloodline Reinforcement</p>
        {report.bloodlineReinforcements.length === 0 ? (
          <p className="mt-4 text-gray-400">No repeated bloodlines detected in this cross.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {report.bloodlineReinforcements.map((item) => (
              <div key={item.ancestorId} className="rounded-2xl border border-white/10 bg-[#08111F] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/pedigree/${item.ancestorId}`} className="text-lg font-bold text-white hover:text-blue-400">
                    {item.name}
                  </Link>
                  {item.verified ? <VerifiedBadge className="scale-90" /> : null}
                </div>
                <p className="mt-2 text-blue-300 font-semibold">{item.notation}</p>
                <p className="mt-2 text-sm text-gray-400">
                  Stallion gen {item.stallionGeneration} · Mare gen {item.mareGeneration} ·{" "}
                  {item.severityLabel}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-dashed border-white/15 bg-[#08111F] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">H. Data Limitations / Disclaimer</p>
        <p className="mt-3 text-sm text-gray-300 leading-7">{BREEDING_DISCLAIMER}</p>
        <ul className="mt-4 space-y-2 text-sm text-gray-400 list-disc pl-5">
          <li>Analysis is deterministic and based only on structured pedigree records available at runtime.</li>
          <li>Verified badges indicate admin-reviewed pedigree identity, not genetic or veterinary approval.</li>
          <li>Same-name horses with different UUIDs are treated as distinct ancestors.</li>
          <li>Incomplete pedigrees reduce data confidence and may omit common ancestors.</li>
        </ul>
      </section>
    </div>
  );
}

function IndicatorCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 font-semibold text-white break-words">{value}</p>
    </div>
  );
}

function CompletenessCard({
  title,
  percent,
  known,
  expected,
  verified,
}: {
  title: string;
  percent: number;
  known: number;
  expected: number;
  verified: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-5">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title} pedigree completeness</p>
      <p className="mt-2 text-3xl font-black text-white">{percent}%</p>
      <p className="mt-2 text-sm text-gray-400">
        {known} / {expected} ancestor slots known · {verified} verified ancestors
      </p>
    </div>
  );
}

function SideBlock({
  title,
  closest,
  count,
  generations,
}: {
  title: string;
  closest: number;
  count: number;
  generations: number[];
}) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-white">Closest generation: {closest || "—"}</p>
      <p className="mt-1 text-sm text-gray-400">Occurrences: {count}</p>
      <p className="mt-1 text-sm text-gray-500">Generations: {generations.join(", ") || "—"}</p>
    </div>
  );
}

function SeverityBadge({
  label,
  severity,
}: {
  label: string;
  severity: "very_close" | "close" | "moderate" | "distant";
}) {
  const className =
    severity === "very_close"
      ? "border-red-500/40 bg-red-950/30 text-red-200"
      : severity === "close"
        ? "border-amber-500/40 bg-amber-950/30 text-amber-200"
        : severity === "moderate"
          ? "border-blue-500/30 bg-blue-950/20 text-blue-200"
          : "border-white/10 bg-[#111827] text-gray-300";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}
