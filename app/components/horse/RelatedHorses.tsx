import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Horse } from "@/app/data/horses";
import RelatedHorsesCarousel from "@/app/components/horse/RelatedHorsesCarousel";

type Props = {
  currentHorse: Horse;
  horses: Horse[];
  favoriteListingIds?: string[];
};

export default async function RelatedHorses({
  currentHorse,
  horses,
  favoriteListingIds = [],
}: Props) {
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
    <div className="min-w-0">
      <RelatedHorsesCarousel
        horses={related}
        favoriteListingIds={favoriteListingIds}
        title={t("related.title")}
        browseAllHref="/horses"
        browseAllLabel={t("related.browseAll")}
      />
      <div className="mt-4 text-right lg:hidden">
        <Link href="/horses" className="text-sm font-medium text-blue-300">
          {t("related.browseAll")}
        </Link>
      </div>
    </div>
  );
}
