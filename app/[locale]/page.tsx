import { getActiveHorseListings } from "@/app/actions/horse-listings";
import { getActiveHomepageAdvertisements } from "@/app/actions/advertisements";
import { getHeroStats } from "@/app/actions/home-stats";
import { getUserFavoriteListingIds } from "@/app/actions/favorites";
import HomeClient from "@/app/components/home/HomeClient";
import { listingRowToHorse } from "@/app/lib/horse-listings";
import { getSiteBaseUrl } from "@/app/lib/seo/site-url";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import dynamicImport from "next/dynamic";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

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
  const locale = await getLocale();
  const tCommon = await getTranslations("common");
  const tMetadata = await getTranslations("metadata");
  const baseUrl = getSiteBaseUrl();
  const siteName = tMetadata("site.name");
  const siteDescription = tMetadata("site.description");
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: siteName,
        url: baseUrl,
        logo: `${baseUrl}/shabdiz-logo.svg`,
        description: siteDescription,
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: siteName,
        url: baseUrl,
        inLanguage: locale,
        publisher: { "@id": `${baseUrl}/#organization` },
      },
    ],
  };

  const [{ data: listingRows }, favoriteListingIds, heroStats, advertisements] = await Promise.all([
    getActiveHorseListings(100),
    getUserFavoriteListingIds(),
    getHeroStats(),
    getActiveHomepageAdvertisements(),
  ]);
  const marketplaceHorses = listingRows.map((row) =>
    listingRowToHorse(row, { priceOnRequestLabel: tCommon("priceOnRequest") })
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      <HomeClient
        marketplaceHorses={marketplaceHorses}
        favoriteListingIds={favoriteListingIds}
        heroStats={heroStats}
        advertisements={advertisements}
        premiumStallions={<PremiumStallions />}
      />
    </>
  );
}
