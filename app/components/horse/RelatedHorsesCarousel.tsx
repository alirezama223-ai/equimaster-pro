"use client";

import { memo, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { Horse } from "@/app/data/horses";
import MarketplaceListingCard from "@/app/components/marketplace/MarketplaceListingCard";

type Props = {
  horses: Horse[];
  favoriteListingIds: string[];
  browseAllHref: string;
  browseAllLabel: string;
  title: string;
};

function RelatedHorsesCarousel({
  horses,
  favoriteListingIds,
  browseAllHref,
  browseAllLabel,
  title,
}: Props) {
  const favoriteSet = useMemo(() => new Set(favoriteListingIds), [favoriteListingIds]);

  if (horses.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-horses-heading" className="mt-16 min-w-0 lg:mt-20">
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <h2 id="related-horses-heading" className="text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h2>
        <Link
          href={browseAllHref}
          className="hidden shrink-0 text-sm font-medium text-blue-300 transition xl:inline [@media(hover:hover)]:hover:text-blue-200"
        >
          {browseAllLabel}
        </Link>
      </div>

      <div className="relative min-w-0">
        <div className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] xl:grid xl:grid-cols-4 xl:gap-6 xl:overflow-visible xl:pb-0 [&::-webkit-scrollbar]:hidden">
          {horses.slice(0, 4).map((horse) => (
            <div
              key={horse.listingUuid ?? horse.id}
              className="w-[min(calc(100vw-2.5rem),320px)] shrink-0 snap-center xl:w-auto xl:shrink"
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
      </div>
    </section>
  );
}

export default memo(RelatedHorsesCarousel);
