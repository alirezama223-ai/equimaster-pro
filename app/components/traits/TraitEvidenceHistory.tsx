"use client";

import { useTransition } from "react";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { deleteTraitAssessment } from "@/app/actions/traits";
import { formatSourceType } from "@/app/lib/traits/evidence-labels";
import { TraitEvidenceHistoryRow } from "@/app/types/traits";

type Props = {
  rows: TraitEvidenceHistoryRow[];
  pedigreeHorseId: string;
};

export default function TraitEvidenceHistory({ rows }: Props) {
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
        No trait assessments submitted yet for this horse.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#08111F]">
      <table className="min-w-full text-sm">
        <thead className="border-b border-white/10 text-left text-gray-400">
          <tr>
            <th className="px-4 py-3">Trait</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Confidence</th>
            <th className="px-4 py-3">Verified</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Note</th>
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
              <td className="px-4 py-3">{row.verified ? <VerifiedBadge /> : "No"}</td>
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
                    Delete
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-gray-500">
        Private provenance view for authorized managers only. Public pages use aggregated evidence without
        private notes or submitter identity.
      </p>
    </div>
  );
}
