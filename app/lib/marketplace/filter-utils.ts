import type {
  MarketplaceAvailabilityFilter,
  MarketplaceSearchParams,
} from "@/app/types/marketplace";
import { buildMarketplaceSearchQuery } from "@/app/lib/marketplace/search";
import { shouldUseRadiusSearch } from "@/app/lib/marketplace/radius";

export type MarketplaceDraftInputs = {
  q: string;
  minPrice: string;
  maxPrice: string;
  minAge: string;
  maxAge: string;
  minHeight: string;
  maxHeight: string;
  color: string;
  studbook: string;
};

export type MarketplaceFilterChipDefinition = {
  id: string;
  removePatch: Partial<MarketplaceSearchParams>;
};

export const DEFAULT_MARKETPLACE_FILTERS: MarketplaceSearchParams = {
  sort: "newest",
  availability: "all",
  page: 1,
};

export function parseDraftNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function draftInputsFromFilters(
  filters: MarketplaceSearchParams
): MarketplaceDraftInputs {
  return {
    q: filters.q ?? "",
    minPrice: filters.minPrice != null ? String(filters.minPrice) : "",
    maxPrice: filters.maxPrice != null ? String(filters.maxPrice) : "",
    minAge: filters.minAge != null ? String(filters.minAge) : "",
    maxAge: filters.maxAge != null ? String(filters.maxAge) : "",
    minHeight: filters.minHeight != null ? String(filters.minHeight) : "",
    maxHeight: filters.maxHeight != null ? String(filters.maxHeight) : "",
    color: filters.color ?? "",
    studbook: filters.studbook ?? "",
  };
}

export function filtersFromDraftInputs(
  draft: MarketplaceDraftInputs
): Partial<MarketplaceSearchParams> {
  return {
    q: draft.q.trim() || undefined,
    minPrice: parseDraftNumber(draft.minPrice),
    maxPrice: parseDraftNumber(draft.maxPrice),
    minAge: parseDraftNumber(draft.minAge),
    maxAge: parseDraftNumber(draft.maxAge),
    minHeight: parseDraftNumber(draft.minHeight),
    maxHeight: parseDraftNumber(draft.maxHeight),
    color: draft.color.trim() || undefined,
    studbook: draft.studbook.trim() || undefined,
  };
}

export function mergeMarketplaceFilters(
  base: MarketplaceSearchParams,
  patch: Partial<MarketplaceSearchParams>
): MarketplaceSearchParams {
  return { ...base, ...patch };
}

export function marketplaceFiltersQuery(
  filters: MarketplaceSearchParams
): string {
  return buildMarketplaceSearchQuery(filters);
}

export function countActiveMarketplaceFilters(
  filters: MarketplaceSearchParams
): number {
  let count = 0;

  if (filters.q?.trim()) count += 1;
  if (filters.breed && filters.breed !== "All") count += 1;
  if (filters.country && filters.country !== "All") count += 1;
  if (filters.gender && filters.gender !== "All") count += 1;
  if (filters.discipline && filters.discipline !== "All") count += 1;
  if (filters.level && filters.level !== "All") count += 1;
  if (filters.studbook?.trim()) count += 1;
  if (filters.availability && filters.availability !== "all") count += 1;
  if (filters.color?.trim()) count += 1;
  if (filters.verified || filters.verifiedHorses) count += 1;
  if (filters.verifiedSellers) count += 1;
  if (filters.minPrice != null || filters.maxPrice != null) count += 1;
  if (filters.minAge != null || filters.maxAge != null) count += 1;
  if (filters.minHeight != null || filters.maxHeight != null) count += 1;
  if (shouldUseRadiusSearch(filters)) count += 1;

  return count;
}

export function getMarketplaceFilterChipDefinitions(
  filters: MarketplaceSearchParams
): MarketplaceFilterChipDefinition[] {
  const chips: MarketplaceFilterChipDefinition[] = [];

  if (filters.q?.trim()) {
    chips.push({ id: "q", removePatch: { q: undefined } });
  }
  if (filters.breed && filters.breed !== "All") {
    chips.push({ id: "breed", removePatch: { breed: undefined } });
  }
  if (filters.country && filters.country !== "All") {
    chips.push({ id: "country", removePatch: { country: undefined } });
  }
  if (filters.gender && filters.gender !== "All") {
    chips.push({ id: "gender", removePatch: { gender: undefined } });
  }
  if (filters.discipline && filters.discipline !== "All") {
    chips.push({ id: "discipline", removePatch: { discipline: undefined } });
  }
  if (filters.level && filters.level !== "All") {
    chips.push({ id: "level", removePatch: { level: undefined } });
  }
  if (filters.studbook?.trim()) {
    chips.push({ id: "studbook", removePatch: { studbook: undefined } });
  }
  if (filters.availability && filters.availability !== "all") {
    chips.push({
      id: "availability",
      removePatch: { availability: "all" satisfies MarketplaceAvailabilityFilter },
    });
  }
  if (filters.color?.trim()) {
    chips.push({ id: "color", removePatch: { color: undefined } });
  }
  if (filters.verified || filters.verifiedHorses) {
    chips.push({ id: "verifiedHorses", removePatch: { verified: false, verifiedHorses: false } });
  }
  if (filters.verifiedSellers) {
    chips.push({ id: "verifiedSellers", removePatch: { verifiedSellers: false } });
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    chips.push({
      id: "price",
      removePatch: { minPrice: undefined, maxPrice: undefined },
    });
  }
  if (filters.minAge != null || filters.maxAge != null) {
    chips.push({
      id: "age",
      removePatch: { minAge: undefined, maxAge: undefined },
    });
  }
  if (filters.minHeight != null || filters.maxHeight != null) {
    chips.push({
      id: "height",
      removePatch: { minHeight: undefined, maxHeight: undefined },
    });
  }
  if (shouldUseRadiusSearch(filters)) {
    chips.push({
      id: "radius",
      removePatch: { radiusKm: undefined, originLat: undefined, originLng: undefined },
    });
  }

  return chips;
}
