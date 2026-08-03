import { getActiveHorseListings } from "@/app/actions/horse-listings";
import { getMarketplaceFilterOptions } from "@/app/actions/marketplace";
import { getUserFavoriteListingIds } from "@/app/actions/favorites";
import MarketplaceHomeClient from "@/app/components/marketplace/MarketplaceHomeClient";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { listingRowToHorse } from "@/app/lib/horse-listings";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("marketplace", "/marketplace");
}

export default async function MarketplacePage() {
  const tCommon = await getTranslations("common");
  const [{ data: listings }, filterOptions, favoriteListingIds] = await Promise.all([
    getActiveHorseListings(48),
    getMarketplaceFilterOptions(),
    getUserFavoriteListingIds(),
  ]);

  const horses = listings.map((row) =>
    listingRowToHorse(row, { priceOnRequestLabel: tCommon("priceOnRequest") })
  );
  const featuredHorses = horses.filter((horse) => horse.verified).slice(0, 6);
  const featuredIds = new Set(featuredHorses.map((horse) => horse.listingUuid));
  const newestHorses = horses.filter((horse) => !featuredIds.has(horse.listingUuid)).slice(0, 6);

  return (
    <MarketplaceHomeClient
      featuredHorses={featuredHorses.length > 0 ? featuredHorses : horses.slice(0, 6)}
      newestHorses={newestHorses.length > 0 ? newestHorses : horses.slice(0, 6)}
      breeds={filterOptions.breeds}
      disciplines={filterOptions.disciplines}
      favoriteListingIds={favoriteListingIds}
    />
  );
}
