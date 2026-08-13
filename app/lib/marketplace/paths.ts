export function getPublicListingPath(slug: string): string {
  return `/horses/${slug}`;
}

export function getListingPreviewPath(listingId: string): string {
  return `/dashboard/seller/listings/${listingId}/preview`;
}

export function getListingEditPath(listingId: string): string {
  return `/dashboard/seller/listings/${listingId}/edit`;
}

export function getTraitEvidencePath(pedigreeHorseId: string): string {
  return `/pedigree/${pedigreeHorseId}/traits`;
}

export const MARKETPLACE_PATHS = {
  home: "/marketplace",
  sellerDashboard: "/dashboard/seller",
  createListing: "/sell",
  inbox: "/inbox",
} as const;
