"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import TraitAssessmentForm from "@/app/components/traits/TraitAssessmentForm";
import TraitEvidenceHistory from "@/app/components/traits/TraitEvidenceHistory";
import TraitProfileSection from "@/app/components/traits/TraitProfileSection";
import { HorseTraitProfile, TraitEvidenceHistoryRow } from "@/app/types/traits";

type Props = {
  pedigreeHorseId: string;
  horseName: string;
  profile: HorseTraitProfile;
  historyRows: TraitEvidenceHistoryRow[];
  sourceLabel?: string | null;
};

export default function TraitManagementPanel({
  pedigreeHorseId,
  horseName,
  profile,
  historyRows,
  sourceLabel,
}: Props) {
  const t = useTranslations("traits");
  const [tab, setTab] = useState<"profile" | "submit" | "history">("profile");

  const tabs = [
    ["profile", t("management.profileTab")],
    ["submit", t("management.submitTab")],
    ["history", t("management.historyTab")],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === key ? "bg-blue-600 text-white" : "border border-white/10 text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" ? <TraitProfileSection profile={profile} showProvenance /> : null}
      {tab === "submit" ? (
        <TraitAssessmentForm
          pedigreeHorseId={pedigreeHorseId}
          horseName={horseName}
          initialSourceLabel={sourceLabel}
        />
      ) : null}
      {tab === "history" ? (
        <TraitEvidenceHistory rows={historyRows} pedigreeHorseId={pedigreeHorseId} />
      ) : null}
    </div>
  );
}
