import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Horse } from "@/app/data/horses";
import { findCountryByName } from "@/app/lib/constants/countries";
import type { PedigreeHorse } from "@/app/types/pedigree";
import HorseDetailSection from "@/app/components/horse/HorseDetailSection";

const factIcons: Record<string, string> = { breed: "◆", age: "◎", height: "↕", gender: "⚲", color: "◐", location: "⌖", studbook: "▣" };

type Props = { horse: Horse; pedigreeHorse: PedigreeHorse | null };

export default async function HorseQuickFacts({ horse, pedigreeHorse }: Props) {
  const t = await getTranslations("horse");
  const tMarketplace = await getTranslations("marketplace");
  const country = findCountryByName(horse.country);
  const studbook = pedigreeHorse?.studbook?.trim();
  const genderLabels = { Mare: tMarketplace("advancedSearch.mare"), Stallion: tMarketplace("advancedSearch.stallion"), Gelding: tMarketplace("advancedSearch.gelding") } as const;
  const genderLabel = genderLabels[horse.gender as keyof typeof genderLabels] ?? horse.gender;
  const facts: { key: string; label: string; value: ReactNode; icon: string }[] = [
    { key: "breed", label: t("info.breed"), value: horse.breed, icon: factIcons.breed },
    { key: "age", label: t("info.age"), value: t("info.ageValue", { age: horse.age }), icon: factIcons.age },
    { key: "height", label: t("info.height"), value: t("info.heightValue", { height: horse.height }), icon: factIcons.height },
    { key: "gender", label: t("info.gender"), value: genderLabel, icon: factIcons.gender },
    { key: "color", label: t("info.color"), value: horse.color, icon: factIcons.color },
    { key: "discipline", label: t("info.discipline"), value: horse.discipline, icon: factIcons.breed },
    { key: "training", label: t("info.training"), value: horse.level, icon: factIcons.height },
    { key: "location", label: t("info.country"), value: country ? <span className="inline-flex items-center gap-1.5"><span aria-hidden="true">{country.flag}</span><span className="truncate">{horse.country}</span></span> : horse.country, icon: factIcons.location },
  ];
  if (studbook) facts.push({ key: "studbook", label: tMarketplace("browse.studbook"), value: studbook, icon: factIcons.studbook });

  return (
    <HorseDetailSection id="overview" title={t("info.breed")} subtitle={`${horse.discipline} · ${horse.level}`}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {facts.map((fact) => <FactCard key={fact.key} icon={fact.icon} label={fact.label} value={fact.value} />)}
      </div>
    </HorseDetailSection>
  );
}

function FactCard({ icon, label, value }: { icon: string; label: string; value: ReactNode }) {
  return (
    <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition duration-300 [@media(hover:hover)]:hover:border-[#D4A437]/30 [@media(hover:hover)]:hover:bg-[#D4A437]/[0.04] sm:p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4A437]/25 bg-[#D4A437]/[0.08] text-sm font-bold text-[#F7E1A1]">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-1 truncate text-base font-semibold text-white sm:text-lg">{value}</p>
        </div>
      </div>
    </div>
  );
}
