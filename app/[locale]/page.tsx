import { getActiveHorseListings } from "@/app/actions/horse-listings";
import { getHeroStats } from "@/app/actions/home-stats";
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
  const [{ data: listingRows }, favoriteListingIds, heroStats] = await Promise.all([
    getActiveHorseListings(100),
    getUserFavoriteListingIds(),
    getHeroStats(),
  ]);
  const marketplaceHorses = listingRows.map((row) =>
    listingRowToHorse(row, { priceOnRequestLabel: tCommon("priceOnRequest") })
  );

  return (
    <HomeClient
      marketplaceHorses={marketplaceHorses}
      favoriteListingIds={favoriteListingIds}
      heroStats={heroStats}
      premiumStallions={<PremiumStallions />}
    />
  );
}
