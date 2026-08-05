import { getTranslations } from "next-intl/server";
import { Horse } from "@/app/data/horses";
import HorseDetailSection from "@/app/components/horse/HorseDetailSection";

type Props = {
  horse: Horse;
};

export default async function HorseDescription({ horse }: Props) {
  const t = await getTranslations("horse");

  return (
    <HorseDetailSection id="description" title={t("description.title")}>
      <div className="max-w-3xl text-base leading-[1.85] text-gray-300 sm:text-lg sm:leading-[1.9]">
        <p className="whitespace-pre-line">
          {horse.description ||
            t("description.fallback", {
              name: horse.name,
              breed: horse.breed,
              country: horse.country,
              discipline: horse.discipline.toLowerCase(),
            })}
        </p>
      </div>
    </HorseDetailSection>
  );
}
