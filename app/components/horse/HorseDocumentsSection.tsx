import { getTranslations } from "next-intl/server";
import type { PedigreeHorse } from "@/app/types/pedigree";
import HorseDetailSection from "@/app/components/horse/HorseDetailSection";
import HorseSectionEmpty from "@/app/components/horse/HorseSectionEmpty";

type Props = {
  pedigreeHorse: PedigreeHorse | null;
};

export default async function HorseDocumentsSection({ pedigreeHorse }: Props) {
  const tPedigree = await getTranslations("pedigree");
  const registration = pedigreeHorse?.registrationNumber?.trim();

  return (
    <HorseDetailSection
      id="documents"
      title={tPedigree("profile.registration")}
      subtitle={tPedigree("section.subtitle")}
    >
      {registration ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {tPedigree("profile.registration")}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {tPedigree("registrationPrefix", { number: registration })}
          </p>
        </div>
      ) : (
        <HorseSectionEmpty message="No registration or passport documents are published for this listing yet." />
      )}
    </HorseDetailSection>
  );
}
