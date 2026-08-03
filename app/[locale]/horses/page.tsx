import { searchMarketplaceListings, getMarketplaceFilterOptions } from "@/app/actions/marketplace";
import { getUserFavoriteListingIds } from "@/app/actions/favorites";
import MarketplaceBrowseClient from "@/app/components/marketplace/MarketplaceBrowseClient";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { parseMarketplaceSearchParams } from "@/app/lib/marketplace/search";
import { listingRowToHorse } from "@/app/lib/horse-listings";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("horses", "/horses");
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HorsesBrowsePage({ searchParams }: Props) {
  const tCommon = await getTranslations("common");
  const resolvedSearchParams = await searchParams;
  const filters = parseMarketplaceSearchParams(resolvedSearchParams);

  const [{ result, error: searchError }, filterOptions, favoriteListingIds] = await Promise.all([
    searchMarketplaceListings(filters),
    getMarketplaceFilterOptions(),
    getUserFavoriteListingIds(),
  ]);

  const horses = result.listings.map((row) =>
    listingRowToHorse(row, { priceOnRequestLabel: tCommon("priceOnRequest") })
  );

  return (
    <MarketplaceBrowseClient
      horses={horses}
      result={result}
      filters={filters}
      filterOptions={filterOptions}
      favoriteListingIds={favoriteListingIds}
      searchError={searchError}
    />
  );
}
