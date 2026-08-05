"use client";

import { memo, useMemo } from "react";
import { Horse } from "@/app/data/horses";
import MarketplaceListingCard from "@/app/components/marketplace/MarketplaceListingCard";

type Props = {
  horses: Horse[];
  favoriteListingIds: string[];
};

function SellerListingsGrid({ horses, favoriteListingIds }: Props) {
  const favoriteSet = useMemo(() => new Set(favoriteListingIds), [favoriteListingIds]);

  if (horses.length === 0) {
    return null;
  }

  return (
    <div className="relative min-w-0">
      <div className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0 xl:grid-cols-4 xl:gap-6 [&::-webkit-scrollbar]:hidden">
        {horses.map((horse) => (
          <div
            key={horse.listingUuid ?? horse.id}
            className="w-[min(calc(100vw-2.5rem),320px)] shrink-0 snap-center md:w-auto md:shrink"
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
  );
}

export default memo(SellerListingsGrid);
