"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { getTraitDefinition, getTraitsByCategory } from "@/app/lib/traits/constants";
import { formatAggregatedConfidence } from "@/app/lib/traits/evidence-labels";
import { HorseTraitProfile, TraitKey } from "@/app/types/traits";

type Props = {
  profile: HorseTraitProfile;
  compact?: boolean;
  showProvenance?: boolean;
};

function confidenceClass(level: string): string {
  switch (level) {
    case "high":
      return "text-emerald-300";
    case "moderate":
      return "text-amber-200";
    case "limited":
      return "text-orange-300";
    default:
      return "text-gray-400";
  }
}

export default function TraitProfileSection({ profile, compact = false, showProvenance = false }: Props) {
  const t = useTranslations("traits");
  const grouped = getTraitsByCategory();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    compact ? null : "sport_performance"
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{t("profile.eyebrow")}</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{t("profile.title")}</h2>
          <p className="mt-2 text-sm text-gray-400">
            {t("profile.subtitle")}
          </p>
        </div>
        <span className={`rounded-full border border-white/10 px-3 py-1 text-xs font-semibold ${confidenceClass(profile.overallConfidence)}`}>
          {t("profile.overallConfidence", { level: profile.overallConfidence.replace("_", " ").toUpperCase() })}
        </span>
      </div>

      {!compact ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryBlock title={t("profile.strengths")} items={profile.strengths.map((item) => item.label)} empty={t("profile.noneWithEvidence")} />
          <SummaryBlock
            title={t("profile.improvementAreas")}
            items={profile.improvementAreas.map((item) => item.label)}
            empty={t("profile.noneWithEvidence")}
          />
          <SummaryBlock
            title={t("profile.insufficientEvidence")}
            items={profile.unknownTraits.slice(0, 6).map((item) => item.label)}
            empty={t("profile.allHaveEvidence")}
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {[...grouped.entries()].map(([category, traits]) => (
          <div key={category} className="rounded-2xl border border-white/10 bg-[#08111F]">
            <button
              type="button"
              onClick={() =>
                setExpandedCategory((current) => (current === category ? null : category))
              }
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-semibold text-white">{traits[0]?.categoryLabel ?? category}</span>
              <span className="text-sm text-gray-500">{expandedCategory === category ? "−" : "+"}</span>
            </button>
            {expandedCategory === category ? (
              <div className="grid gap-2 border-t border-white/10 p-4 sm:grid-cols-2">
                {traits.map((definition) => {
                  const trait = profile.traits.find((item) => item.traitKey === definition.key);
                  return (
                    <div key={definition.key} className="rounded-xl border border-white/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-white">{definition.label}</p>
                        {trait && trait.verifiedEvidenceCount > 0 ? <VerifiedBadge /> : null}
                      </div>
                      {trait?.assessable && trait.score !== null ? (
                        <>
                          <p className="mt-1 text-lg font-bold text-blue-400">{trait.score}/5</p>
                          <p className={`mt-1 text-xs ${confidenceClass(trait.confidence)}`}>
                            {formatAggregatedConfidence(trait.confidence)} · {t("profile.sources", { count: trait.evidenceCount })}
                            {trait.verifiedEvidenceCount > 0
                              ? ` · ${t("profile.verifiedCount", { count: trait.verifiedEvidenceCount })}`
                              : ""}
                            {trait.hasConflict ? ` · ${t("profile.conflictingEvidence")}` : ""}
                          </p>
                          {showProvenance ? (
                            <p className="mt-1 text-xs text-gray-500">{trait.explanation}</p>
                          ) : null}
                        </>
                      ) : trait && trait.evidenceCount > 0 ? (
                        <p className="mt-2 text-sm text-orange-300">
                          {t("profile.evidenceInsufficient")}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">{t("profile.insufficientData")}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">{profile.disclaimer}</p>
    </section>
  );
}

function SummaryBlock({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
      <p className="font-semibold text-white">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-gray-300">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-500">{empty}</p>
      )}
    </div>
  );
}

export function traitLabel(key: TraitKey): string {
  return getTraitDefinition(key).label;
}
