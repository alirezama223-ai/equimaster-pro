"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import PedigreeTree from "@/app/components/pedigree/PedigreeTree";
import { BREEDING_MAX_GENERATIONS } from "@/app/lib/breeding/constants";
import { BreedingAnalysisReport } from "@/app/types/breeding";

type Props = {
  report: BreedingAnalysisReport;
};

export default function BreedingAnalysisReportView({ report }: Props) {
  const t = useTranslations("breeding");
  const tCommon = useTranslations("common");
  const { structureIndicators, dataConfidence } = report;
  const hypotheticalFoalName = t("report.hypotheticalFoalTitle");

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
          {t("report.selectedCrossEyebrow")}
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white">
          {report.mare.name} × {report.stallion.name}
        </h2>
        <p className="mt-3 text-gray-400">
          {t("report.selectedCrossSubtitle", { generations: report.analyzedGenerations })}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <IndicatorCard
            label={t("report.commonAncestors")}
            value={String(structureIndicators.commonAncestorCount)}
          />
          <IndicatorCard
            label={t("report.closestSharedAncestor")}
            value={
              structureIndicators.closestCommonAncestorName
                ? t("report.closestSharedAncestorValue", {
                    name: structureIndicators.closestCommonAncestorName,
                    depth: structureIndicators.closestCommonAncestorDepth ?? 0,
                  })
                : t("noneDetected")
            }
          />
          <IndicatorCard
            label={t("report.linebreedingPatterns")}
            value={String(structureIndicators.linebreedingPatternCount)}
          />
          <IndicatorCard
            label={t("report.repeatedBloodlines")}
            value={String(structureIndicators.repeatedBloodlineCount)}
          />
          <IndicatorCard
            label={t("report.closeRelationshipFlag")}
            value={structureIndicators.closeRelationshipDetected ? t("yes") : t("no")}
          />
          <IndicatorCard label={t("report.dataConfidenceTitle")} value={dataConfidence.label} />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#08111F] p-4 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
          {t("report.hypotheticalFoalEyebrow")}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-white">{hypotheticalFoalName}</h3>
        <p className="mt-2 text-sm text-gray-400">{t("report.hypotheticalFoalSubtitle")}</p>
        <div className="mt-6">
          <PedigreeTree
            subjectName={hypotheticalFoalName}
            subjectLabel={hypotheticalFoalName}
            tree={report.hypotheticalFoalTree}
            maxGenerations={BREEDING_MAX_GENERATIONS}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
          {t("report.completenessEyebrow")}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <CompletenessCard
            title={t("report.mare")}
            percent={dataConfidence.mareCompleteness.completenessPercent}
            known={dataConfidence.mareCompleteness.knownAncestorSlots}
            expected={dataConfidence.mareCompleteness.expectedAncestorSlots}
            verified={dataConfidence.mareCompleteness.verifiedAncestorCount}
            completenessTitle={t("report.completenessTitle", { role: t("report.mare") })}
            completenessDetail={t("report.completenessDetail", {
              known: dataConfidence.mareCompleteness.knownAncestorSlots,
              expected: dataConfidence.mareCompleteness.expectedAncestorSlots,
              verified: dataConfidence.mareCompleteness.verifiedAncestorCount,
            })}
          />
          <CompletenessCard
            title={t("report.stallion")}
            percent={dataConfidence.stallionCompleteness.completenessPercent}
            known={dataConfidence.stallionCompleteness.knownAncestorSlots}
            expected={dataConfidence.stallionCompleteness.expectedAncestorSlots}
            verified={dataConfidence.stallionCompleteness.verifiedAncestorCount}
            completenessTitle={t("report.completenessTitle", { role: t("report.stallion") })}
            completenessDetail={t("report.completenessDetail", {
              known: dataConfidence.stallionCompleteness.knownAncestorSlots,
              expected: dataConfidence.stallionCompleteness.expectedAncestorSlots,
              verified: dataConfidence.stallionCompleteness.verifiedAncestorCount,
            })}
          />
          <div className="rounded-2xl border border-white/10 bg-[#08111F] p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {t("report.dataConfidenceTitle")}
            </p>
            <p className="mt-2 text-3xl font-black text-white">{dataConfidence.label}</p>
            <p className="mt-3 text-sm text-gray-400 leading-6">{dataConfidence.explanation}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
          {t("report.commonAncestorsEyebrow")}
        </p>
        {report.commonAncestors.length === 0 ? (
          <p className="mt-4 text-gray-400">{t("report.noCommonAncestors")}</p>
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
                      {t("report.repeatedAncestor")}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <SideBlock
                    title={t("report.stallionSide")}
                    closest={ancestor.stallionSide.closestGeneration}
                    count={ancestor.stallionSide.occurrenceCount}
                    generations={ancestor.stallionSide.generations}
                    closestLabel={t("report.closestGeneration", {
                      value: ancestor.stallionSide.closestGeneration || tCommon("notApplicable"),
                    })}
                    occurrencesLabel={t("report.occurrences", {
                      count: ancestor.stallionSide.occurrenceCount,
                    })}
                    generationsLabel={t("report.generations", {
                      list: ancestor.stallionSide.generations.join(", ") || tCommon("notApplicable"),
                    })}
                  />
                  <SideBlock
                    title={t("report.mareSide")}
                    closest={ancestor.mareSide.closestGeneration}
                    count={ancestor.mareSide.occurrenceCount}
                    generations={ancestor.mareSide.generations}
                    closestLabel={t("report.closestGeneration", {
                      value: ancestor.mareSide.closestGeneration || tCommon("notApplicable"),
                    })}
                    occurrencesLabel={t("report.occurrences", {
                      count: ancestor.mareSide.occurrenceCount,
                    })}
                    generationsLabel={t("report.generations", {
                      list: ancestor.mareSide.generations.join(", ") || tCommon("notApplicable"),
                    })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
          {t("report.linebreedingEyebrow")}
        </p>
        <p className="mt-2 text-sm text-gray-400">{t("generationNumberingExplanation")}</p>
        {report.linebreedingPatterns.length === 0 ? (
          <p className="mt-4 text-gray-400">{t("report.noLinebreeding")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">{t("report.ancestor")}</th>
                  <th className="py-2 pr-4">{t("report.notation")}</th>
                  <th className="py-2 pr-4">{t("report.stallionGen")}</th>
                  <th className="py-2 pr-4">{t("report.mareGen")}</th>
                  <th className="py-2">{t("report.severity")}</th>
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
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
          {t("report.warningsEyebrow")}
        </p>
        {report.closeRelationshipWarnings.length === 0 ? (
          <p className="mt-4 text-gray-400">{t("report.noCloseRelationships")}</p>
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
            <p className="text-sm text-gray-400 leading-6">{t("closeRelationshipAdvisory")}</p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
          {t("report.reinforcementEyebrow")}
        </p>
        {report.bloodlineReinforcements.length === 0 ? (
          <p className="mt-4 text-gray-400">{t("report.noReinforcement")}</p>
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
                  {t("report.stallionGenShort", { gen: item.stallionGeneration })} ·{" "}
                  {t("report.mareGenShort", { gen: item.mareGeneration })} · {item.severityLabel}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-dashed border-white/15 bg-[#08111F] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
          {t("report.disclaimerEyebrow")}
        </p>
        <p className="mt-3 text-sm text-gray-300 leading-7">{t("disclaimer")}</p>
        <ul className="mt-4 space-y-2 text-sm text-gray-400 list-disc pl-5">
          <li>{t("report.disclaimerBullet1")}</li>
          <li>{t("report.disclaimerBullet2")}</li>
          <li>{t("report.disclaimerBullet3")}</li>
          <li>{t("report.disclaimerBullet4")}</li>
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
  completenessTitle,
  completenessDetail,
}: {
  title: string;
  percent: number;
  known: number;
  expected: number;
  verified: number;
  completenessTitle: string;
  completenessDetail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-5">
      <p className="text-xs uppercase tracking-wide text-gray-500">{completenessTitle}</p>
      <p className="mt-2 text-3xl font-black text-white">{percent}%</p>
      <p className="mt-2 text-sm text-gray-400">{completenessDetail}</p>
    </div>
  );
}

function SideBlock({
  title,
  closestLabel,
  occurrencesLabel,
  generationsLabel,
}: {
  title: string;
  closest: number;
  count: number;
  generations: number[];
  closestLabel: string;
  occurrencesLabel: string;
  generationsLabel: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-white">{closestLabel}</p>
      <p className="mt-1 text-sm text-gray-400">{occurrencesLabel}</p>
      <p className="mt-1 text-sm text-gray-500">{generationsLabel}</p>
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
