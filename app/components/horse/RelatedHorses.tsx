import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Horse } from "@/app/data/horses";
import HorseCard from "@/app/components/featured/HorseCard";

type Props = {
  currentHorse: Horse;
  horses: Horse[];
};

export default async function RelatedHorses({ currentHorse, horses }: Props) {
  const t = await getTranslations("horse");
  const related = horses.filter(
    (horse) =>
      horse.id !== currentHorse.id &&
      horse.listingUuid !== currentHorse.listingUuid
  );

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 lg:mt-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-3xl font-bold">{t("related.title")}</h2>
        <Link href="/horses" className="text-sm text-blue-300 hover:text-blue-200">
          {t("related.browseAll")}
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {related.slice(0, 3).map((horse) => (
          <HorseCard key={horse.listingUuid ?? horse.id} horse={horse} />
        ))}
      </div>
    </section>
  );
}
