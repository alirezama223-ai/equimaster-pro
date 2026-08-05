import { getActiveHorseListings } from "@/app/actions/horse-listings";
import { getHeroStats } from "@/app/actions/home-stats";
import { getUserFavoriteListingIds } from "@/app/actions/favorites";
import HomeClient from "@/app/components/home/HomeClient";
import { listingRowToHorse } from "@/app/lib/horse-listings";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import dynamicImport from "next/dynamic";
import { getTranslations } from "next-intl/server";

const PremiumStallions = dynamicImport(
  () => import("@/app/components/stallions/PremiumStallions"),
  {
    loading: () => (
      <section className="bg-[#081223] py-20 sm:py-28" aria-hidden="true">
        <div className="mx-auto h-64 max-w-7xl animate-pulse rounded-3xl bg-white/5 px-4 sm:px-6" />
      </section>
    ),
  }
);

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
