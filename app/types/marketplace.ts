import type { ListingStatus } from "@/app/types/horse-listing";

export type MarketplaceSortOption =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "age-asc"
  | "age-desc"
  | "height-asc"
  | "height-desc"
  | "featured";

export type MarketplaceAvailabilityFilter = "all" | "priced" | "on_request";

export type MarketplaceSearchParams = {
  q?: string;
  breed?: string;
  country?: string;
  gender?: string;
  discipline?: string;
  color?: string;
  level?: string;
  studbook?: string;
  availability?: MarketplaceAvailabilityFilter;
  verified?: boolean;
  verifiedSellers?: boolean;
  verifiedHorses?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  sort?: MarketplaceSortOption;
  page?: number;
  pageSize?: number;
};

export type MarketplaceSearchResult = {
  listings: import("@/app/types/horse-listing").HorseListingRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SellerListingStats = {
  total: number;
  active: number;
  draft: number;
  sold: number;
  archived: number;
};

export type ListingPublishState = {
  status: ListingStatus;
  publishedAt: string | null;
};
