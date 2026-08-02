"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import AdminNav from "@/app/components/admin/AdminNav";
import AdminTraitAssessmentEditDialog, {
  AdminTraitAssessmentEditRow,
} from "@/app/components/admin/AdminTraitAssessmentEditDialog";
import AdminTraitAssessmentForm from "@/app/components/admin/AdminTraitAssessmentForm";
import { AdminVerificationActions } from "@/app/components/admin/AdminVerificationControls";
import {
  adminDeleteTraitAssessment,
  getAdminTraitAssessments,
  setTraitAssessmentVerified,
} from "@/app/actions/traits";
import { getTraitDefinition } from "@/app/lib/traits/constants";
import { formatSourceType } from "@/app/lib/traits/evidence-labels";
import { TraitSourceType } from "@/app/types/traits";
import { useState, useTransition } from "react";

type Props = {
  filter: "pending" | "verified" | "all";
  sourceType?: TraitSourceType;
  pedigreeHorseId?: string;
  assessments: Awaited<ReturnType<typeof getAdminTraitAssessments>>["assessments"];
  stats: { pending: number; verified: number; total: number };
};

const SOURCE_TYPES: TraitSourceType[] = [
  "owner_reported",
  "breeder_reported",
  "admin_assessed",
  "verified_record",
  "performance_data",
  "offspring_data",
];

export default function AdminTraitsClient({
  filter,
  sourceType,
  pedigreeHorseId,
  assessments,
  stats,
}: Props) {
  const t = useTranslations("admin.traits");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingRow, setEditingRow] = useState<AdminTraitAssessmentEditRow | null>(null);

  function buildHref(next: { filter?: string; sourceType?: string | null; horse?: string | null }) {
    const params = new URLSearchParams();
    params.set("filter", next.filter ?? filter);
    if ("sourceType" in next) {
      if (next.sourceType) params.set("sourceType", next.sourceType);
    } else if (sourceType) {
      params.set("sourceType", sourceType);
    }
    if ("horse" in next) {
      if (next.horse) params.set("horse", next.horse);
    } else if (pedigreeHorseId) {
      params.set("horse", pedigreeHorseId);
    }
    return `/admin/traits?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      <AdminNav />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={t("totalAssessments")} value={stats.total} />
        <Stat label={t("pendingVerification")} value={stats.pending} />
        <Stat label={t("verified")} value={stats.verified} />
      </div>

      <div className="flex flex-wrap gap-3">
        {(["all", "pending", "verified"] as const).map((item) => (
          <Link
            key={item}
            href={buildHref({ filter: item })}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              filter === item ? "bg-blue-600 text-white" : "border border-white/10 text-gray-300"
            }`}
          >
            {item === "all" ? t("filterAll") : item === "pending" ? t("filterPending") : t("filterVerified")}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref({ sourceType: null })}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            !sourceType ? "bg-white/10 text-white" : "border border-white/10 text-gray-400"
          }`}
        >
          {t("allSources")}
        </Link>
        {SOURCE_TYPES.map((item) => (
          <Link
            key={item}
            href={buildHref({ sourceType: item })}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              sourceType === item ? "bg-white/10 text-white" : "border border-white/10 text-gray-400"
            }`}
          >
            {formatSourceType(item)}
          </Link>
        ))}
      </div>

      <form
        className="flex flex-wrap gap-3 items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const horse = new FormData(form).get("horse")?.toString().trim();
          router.push(buildHref({ horse: horse || "" }));
        }}
      >
        <label className="text-sm text-gray-300">
          {t("filterByHorseId")}
          <input
            name="horse"
            defaultValue={pedigreeHorseId ?? ""}
            placeholder={t("horseIdPlaceholder")}
            className="mt-1 block w-80 max-w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-white"
          />
        </label>
        <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          {t("apply")}
        </button>
      </form>

      <p className="text-sm text-gray-400">{t("verificationNote")}</p>

      <AdminTraitAssessmentForm />

      <AdminTraitAssessmentEditDialog row={editingRow} onClose={() => setEditingRow(null)} />

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#111827]">
        <table className="min-w-full text-sm">
          <thead className="border-b border-white/10 text-left text-gray-400">
            <tr>
              <th className="px-4 py-3">{t("horse")}</th>
              <th className="px-4 py-3">{t("trait")}</th>
              <th className="px-4 py-3">{t("score")}</th>
              <th className="px-4 py-3">{t("source")}</th>
              <th className="px-4 py-3">{t("confidence")}</th>
              <th className="px-4 py-3">{t("verifiedCol")}</th>
              <th className="px-4 py-3">{t("note")}</th>
              <th className="px-4 py-3">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((item) => (
              <tr key={item.id} className="border-b border-white/5 text-gray-200">
                <td className="px-4 py-3">
                  <Link href={`/pedigree/${item.pedigree_horse_id}`} className="text-blue-400 hover:text-blue-300">
                    {item.horseName}
                  </Link>
                </td>
                <td className="px-4 py-3">{getTraitDefinition(item.trait_key as never).label}</td>
                <td className="px-4 py-3">
                  {t("scoreValue", { score: item.score, confidence: item.confidence })}
                </td>
                <td className="px-4 py-3">{formatSourceType(item.source_type)}</td>
                <td className="px-4 py-3 capitalize">{item.confidence}</td>
                <td className="px-4 py-3">{item.verified ? tCommon("yes") : tCommon("no")}</td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-400">{item.source_note ?? "—"}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingRow({
                        id: item.id,
                        horseName: item.horseName,
                        trait_key: item.trait_key,
                        score: item.score,
                        confidence: item.confidence,
                        source_type: item.source_type,
                        source_note: item.source_note,
                        verified: item.verified,
                      })
                    }
                    className="text-xs text-blue-300 hover:text-blue-200"
                  >
                    {tCommon("edit")}
                  </button>
                  <AdminVerificationActions
                    entityLabel={t("entityLabel")}
                    verified={item.verified}
                    onVerify={() => setTraitAssessmentVerified(item.id, true)}
                    onUnverify={() => setTraitAssessmentVerified(item.id, false)}
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await adminDeleteTraitAssessment(item.id);
                        router.refresh();
                      })
                    }
                    className="text-xs text-red-300 hover:text-red-200"
                  >
                    {tCommon("delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
