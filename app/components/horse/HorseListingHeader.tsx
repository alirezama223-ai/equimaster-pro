import { getTranslations } from "next-intl/server";
import { Horse } from "@/app/data/horses";
import { findCountryByName } from "@/app/lib/constants/countries";
import type { PedigreeHorse } from "@/app/types/pedigree";
import HorseTrustBadges from "@/app/components/horse/HorseTrustBadges";
import type { PublicHealthSummarySnapshot } from "@/app/types/marketplace-public";

type Props = {
  horse: Horse;
  healthSummary: PublicHealthSummarySnapshot | null;
  pedigreeHorseId: string | null;
  pedigreeHorse: PedigreeHorse | null;
  hasLegacyPedigree: boolean;
};

export default async function HorseListingHeader({
  horse,
  healthSummary,
  pedigreeHorseId,
  pedigreeHorse,
  hasLegacyPedigree,
}: Props) {
  const t = await getTranslations("horse");
  const country = findCountryByName(horse.country);

  return (
    <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          {horse.discipline}
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          {horse.name}
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-gray-400">
          <span>{horse.breed}</span>
          <span aria-hidden="true">·</span>
          <span>{horse.level}</span>
          {country ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true">{country.flag}</span>
                {horse.country}
              </span>
            </>
          ) : (
            <>
              <span aria-hidden="true">·</span>
              <span>{horse.country}</span>
            </>
          )}
        </p>
        {horse.stableName ? (
          <p className="mt-2 text-sm text-gray-500">{horse.stableName}</p>
        ) : null}
      </div>

      <div className="flex w-full shrink-0 flex-col items-stretch gap-4 lg:w-auto lg:min-w-[280px] lg:max-w-sm lg:items-end">
        <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-[#132038] to-[#0f1729] px-5 py-4 text-left shadow-[0_8px_32px_rgba(37,99,235,0.12)] lg:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300/90">
            {t("info.askingPrice")}
          </p>
          <p className="mt-1 text-3xl font-black leading-none text-white sm:text-4xl">{horse.price}</p>
        </div>

        <HorseTrustBadges
          verified={horse.verified}
          healthSummary={healthSummary}
          pedigreeHorseId={pedigreeHorseId}
          pedigreeHorse={pedigreeHorse}
          hasLegacyPedigree={hasLegacyPedigree}
        />
      </div>
    </header>
  );
}
