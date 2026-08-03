import { getActiveHorseListings } from "@/app/actions/horse-listings";
import { getUserFavoriteListingIds } from "@/app/actions/favorites";
import HomeClient from "@/app/components/home/HomeClient";
import PremiumStallions from "@/app/components/stallions/PremiumStallions";
import { listingRowToHorse } from "@/app/lib/horse-listings";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("home", "/");
}

export default async function Home() {
  const tCommon = await getTranslations("common");
  const [{ data: listingRows }, favoriteListingIds] = await Promise.all([
    getActiveHorseListings(100),
    getUserFavoriteListingIds(),
  ]);
  const marketplaceHorses = listingRows.map((row) =>
    listingRowToHorse(row, { priceOnRequestLabel: tCommon("priceOnRequest") })
  );

  return (
    <HomeClient
      marketplaceHorses={marketplaceHorses}
      favoriteListingIds={favoriteListingIds}
      premiumStallions={<PremiumStallions />}
    />
  );
}
