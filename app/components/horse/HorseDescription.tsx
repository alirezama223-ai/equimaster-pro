import { getTranslations } from "next-intl/server";
import { Horse } from "@/app/data/horses";

type Props = {
  horse: Horse;
};

export default async function HorseDescription({ horse }: Props) {
  const t = await getTranslations("horse");

  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-bold">{t("description.title")}</h2>

      <p className="text-gray-300 leading-8 whitespace-pre-line">
        {horse.description ||
          t("description.fallback", {
            name: horse.name,
            breed: horse.breed,
            country: horse.country,
            discipline: horse.discipline.toLowerCase(),
          })}
      </p>
    </section>
  );
}
