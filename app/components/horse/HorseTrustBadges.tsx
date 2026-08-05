import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { PublicHealthSummarySnapshot } from "@/app/types/marketplace-public";
import type { PedigreeHorse } from "@/app/types/pedigree";

type Props = {
  verified: boolean;
  healthSummary: PublicHealthSummarySnapshot | null;
  pedigreeHorseId: string | null;
  pedigreeHorse: PedigreeHorse | null;
  hasLegacyPedigree: boolean;
};

export default async function HorseTrustBadges({
  verified,
  healthSummary,
  pedigreeHorseId,
  pedigreeHorse,
  hasLegacyPedigree,
}: Props) {
  const tHorse = await getTranslations("horse");
  const tMarketplace = await getTranslations("marketplace");
  const tPedigree = await getTranslations("pedigree");

  const badges: { key: string; label: string }[] = [];

  if (verified) {
    badges.push({
      key: "verified",
      label: `${tHorse("info.verified")} Seller`,
    });
  }

  if (healthSummary?.latestCheckDate || healthSummary?.readinessScore != null) {
    badges.push({
      key: "veterinary",
      label: tMarketplace("healthSummary.title"),
    });
  }

  if (pedigreeHorseId || hasLegacyPedigree || pedigreeHorse) {
    badges.push({
      key: "pedigree",
      label: tPedigree("section.title"),
    });
  }

  if (pedigreeHorse?.registrationNumber?.trim()) {
    badges.push({
      key: "passport",
      label: "Passport",
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap justify-end gap-2">
      {badges.map((badge) => (
        <li key={badge.key}>
          <TrustBadge>{badge.label}</TrustBadge>
        </li>
      ))}
    </ul>
  );
}

function TrustBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
      <span aria-hidden="true" className="text-emerald-400">
        ✓
      </span>
      {children}
    </span>
  );
}
