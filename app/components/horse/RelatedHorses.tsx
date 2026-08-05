import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Horse } from "@/app/data/horses";
import MarketplaceListingCard from "@/app/components/marketplace/MarketplaceListingCard";

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

  const favoriteSet = new Set(favoriteListingIds);

  return (
    <section aria-labelledby="related-horses-heading" className="mt-16 lg:mt-20">
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <h2 id="related-horses-heading" className="text-2xl font-bold text-white sm:text-3xl">
          {t("related.title")}
        </h2>
        <Link
          href="/horses"
          className="shrink-0 text-sm font-medium text-blue-300 transition [@media(hover:hover)]:hover:text-blue-200"
        >
          {t("related.browseAll")}
        </Link>
      </div>

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3 xl:gap-8 [&::-webkit-scrollbar]:hidden">
        {related.slice(0, 6).map((horse) => (
          <div
            key={horse.listingUuid ?? horse.id}
            className="w-[min(88vw,340px)] shrink-0 snap-center md:w-auto md:shrink"
          >
            <MarketplaceListingCard
              horse={horse}
              isFavorited={Boolean(
                horse.listingUuid && favoriteSet.has(horse.listingUuid)
              )}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
