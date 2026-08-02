"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { deleteTraitAssessment } from "@/app/actions/traits";
import { formatSourceType } from "@/app/lib/traits/evidence-labels";
import { TraitEvidenceHistoryRow } from "@/app/types/traits";

type Props = {
  rows: TraitEvidenceHistoryRow[];
  pedigreeHorseId: string;
};

export default function TraitEvidenceHistory({ rows }: Props) {
  const t = useTranslations("traits");
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTraitAssessment(id);
      window.location.reload();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#08111F] p-5 text-sm text-gray-400">
        {t("history.empty")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#08111F]">
      <table className="min-w-full text-sm">
        <thead className="border-b border-white/10 text-left text-gray-400">
          <tr>
            <th className="px-4 py-3">{t("history.trait")}</th>
            <th className="px-4 py-3">{t("history.score")}</th>
            <th className="px-4 py-3">{t("history.source")}</th>
            <th className="px-4 py-3">{t("history.confidence")}</th>
            <th className="px-4 py-3">{t("history.verified")}</th>
            <th className="px-4 py-3">{t("history.date")}</th>
            <th className="px-4 py-3">{t("history.note")}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-white/5 text-gray-200">
              <td className="px-4 py-3">{row.traitLabel}</td>
              <td className="px-4 py-3">{row.score}/5</td>
              <td className="px-4 py-3">{formatSourceType(row.sourceType)}</td>
              <td className="px-4 py-3 capitalize">{row.confidence}</td>
              <td className="px-4 py-3">{row.verified ? <VerifiedBadge /> : t("history.no")}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(row.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 max-w-xs truncate text-gray-400">{row.sourceNote ?? "—"}</td>
              <td className="px-4 py-3">
                {row.canDelete ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDelete(row.id)}
                    className="text-xs text-red-300 hover:text-red-200"
                  >
                    {t("history.delete")}
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-gray-500">
        {t("history.footer")}
      </p>
    </div>
  );
}
