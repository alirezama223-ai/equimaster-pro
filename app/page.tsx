import { getActiveHorseListings } from "@/app/actions/horse-listings";
import { getUserFavoriteListingIds } from "@/app/actions/favorites";
import HomeClient from "@/app/components/home/HomeClient";
import { horses } from "@/app/data/horses";
import {
  listingRowToHorse,
  mergeMarketplaceHorses,
} from "@/app/lib/horse-listings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ data: listingRows }, favoriteListingIds] = await Promise.all([
    getActiveHorseListings(),
    getUserFavoriteListingIds(),
  ]);
  const listingHorses = listingRows.map(listingRowToHorse);
  const marketplaceHorses = mergeMarketplaceHorses(horses, listingHorses);

  return (
    <HomeClient
      marketplaceHorses={marketplaceHorses}
      favoriteListingIds={favoriteListingIds}
    />
  );
}
