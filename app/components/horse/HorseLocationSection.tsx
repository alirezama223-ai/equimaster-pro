import { getTranslations } from "next-intl/server";
import { Horse } from "@/app/data/horses";
import { findCountryByName } from "@/app/lib/constants/countries";
import HorseDetailSection from "@/app/components/horse/HorseDetailSection";

type Props = {
  horse: Horse;
};

export default async function HorseLocationSection({ horse }: Props) {
  const t = await getTranslations("horse");
  const country = findCountryByName(horse.country);

  return (
    <HorseDetailSection id="location" title={t("info.country")}>
      <div className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-600/10 text-2xl"
        >
          {country?.flag ?? "⌖"}
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-white">{horse.country}</p>
          {horse.stableName ? (
            <p className="mt-1 text-sm text-gray-400">{horse.stableName}</p>
          ) : null}
        </div>
      </div>
    </HorseDetailSection>
  );
}
