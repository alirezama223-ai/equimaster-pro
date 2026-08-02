"use client";

import { useTranslations } from "next-intl";
import { BreedingAnalysisReport } from "@/app/types/breeding";

type Props = {
  reports: BreedingAnalysisReport[];
};

export default function BreedingComparePanel({ reports }: Props) {
  const t = useTranslations("breeding");

  if (reports.length === 0) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{t("compare.eyebrow")}</p>
      <h3 className="mt-2 text-2xl font-bold text-white">{t("compare.title")}</h3>
      <p className="mt-2 text-sm text-gray-400">
        {t("compare.subtitle")}
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-white/10">
              <th className="py-3 pr-4">{t("compare.indicator")}</th>
              {reports.map((report) => (
                <th key={report.stallion.id} className="py-3 pr-4 font-semibold text-white">
                  {report.stallion.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow
              label={t("compare.stallionCompleteness")}
              values={reports.map(
                (report) => `${report.dataConfidence.stallionCompleteness.completenessPercent}%`
              )}
            />
            <CompareRow
              label={t("compare.commonAncestorCount")}
              values={reports.map((report) => String(report.structureIndicators.commonAncestorCount))}
            />
            <CompareRow
              label={t("compare.closestCommonAncestor")}
              values={reports.map((report) =>
                report.structureIndicators.closestCommonAncestorName
                  ? `${report.structureIndicators.closestCommonAncestorName} (${report.structureIndicators.closestCommonAncestorDepth})`
                  : t("none")
              )}
            />
            <CompareRow
              label={t("compare.linebreedingPatterns")}
              values={reports.map((report) => String(report.structureIndicators.linebreedingPatternCount))}
            />
            <CompareRow
              label={t("compare.closeRelationshipWarning")}
              values={reports.map((report) =>
                report.structureIndicators.closeRelationshipDetected ? t("yes") : t("no")
              )}
            />
            <CompareRow
              label={t("compare.dataConfidence")}
              values={reports.map((report) => report.dataConfidence.label)}
            />
            <CompareRow
              label={t("compare.notableLinebreeding")}
              values={reports.map((report) =>
                report.linebreedingPatterns.slice(0, 2).map((item) => `${item.name} (${item.notation})`).join(", ") ||
                t("none")
              )}
            />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-white/10">
      <td className="py-3 pr-4 text-gray-400">{label}</td>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className="py-3 pr-4 text-white align-top">
          {value}
        </td>
      ))}
    </tr>
  );
}
