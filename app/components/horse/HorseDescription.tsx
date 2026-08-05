import { getTranslations } from "next-intl/server";
import { Horse } from "@/app/data/horses";

type Props = {
  horse: Horse;
};

export default async function HorseDescription({ horse }: Props) {
  const t = await getTranslations("horse");

  return (
    <section aria-labelledby="horse-description-heading" className="max-w-3xl">
      <h2 id="horse-description-heading" className="text-2xl font-bold text-white sm:text-3xl">
        {t("description.title")}
      </h2>

      <div className="mt-5 text-base leading-[1.85] text-gray-300 sm:text-lg sm:leading-[1.9]">
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
    </section>
  );
}
