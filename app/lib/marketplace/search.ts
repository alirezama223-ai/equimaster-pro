import type { SupabaseClient } from "@supabase/supabase-js";
import { getBreedNames } from "@/app/lib/breeds";
import { COUNTRY_NAMES } from "@/app/lib/constants/countries";
import { DISCIPLINE_LABELS } from "@/app/lib/constants/disciplines";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type {
  MarketplaceAvailabilityFilter,
  MarketplaceSearchParams,
  MarketplaceSearchResult,
  MarketplaceSortOption,
} from "@/app/types/marketplace";

const DEFAULT_PAGE_SIZE = 12;

function isMissingSearchVectorError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("search_vector") ||
    (normalized.includes("could not find") && normalized.includes("column"))
  );
}

function sanitizeIlikePattern(value: string) {
  return value.trim().replace(/[%_,]/g, " ").trim();
}

/** Supabase PostgrestFilterBuilder chain — typed loosely to avoid deep generic instantiation. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListingSearchQuery = any;

function applyTextFilter(query: ListingSearchQuery, searchTerm: string): ListingSearchQuery {
  const escaped = sanitizeIlikePattern(searchTerm);
  if (!escaped) {
    return query;
  }

  const pattern = `%${escaped}%`;
  return query.or(
    [
      `name.ilike.${pattern}`,
      `breed.ilike.${pattern}`,
      `discipline.ilike.${pattern}`,
      `country.ilike.${pattern}`,
      `level.ilike.${pattern}`,
      `color.ilike.${pattern}`,
      `description.ilike.${pattern}`,
      `sire.ilike.${pattern}`,
      `dam.ilike.${pattern}`,
      `dam_sire.ilike.${pattern}`,
      `seller_name.ilike.${pattern}`,
      `stable_name.ilike.${pattern}`,
    ].join(",")
  );
}

function applyListingFilters(query: ListingSearchQuery, params: MarketplaceSearchParams): ListingSearchQuery {
  if (params.breed && params.breed !== "All") {
    query = query.eq("breed", params.breed);
  }

  if (params.country && params.country !== "All") {
    query = query.eq("country", params.country);
  }

  if (params.gender && params.gender !== "All") {
    query = query.eq("gender", params.gender);
  }

  if (params.discipline && params.discipline !== "All") {
    query = query.eq("discipline", params.discipline);
  }

  if (params.level && params.level !== "All") {
    query = query.eq("level", params.level);
  }

  if (params.color?.trim()) {
    query = query.ilike("color", `%${sanitizeIlikePattern(params.color)}%`);
  }

  if (params.verified) {
    query = query.eq("verified", true);
  }

  const availability = params.availability ?? "all";
  if (availability === "priced") {
    query = query.eq("price_on_request", false);
  } else if (availability === "on_request") {
    query = query.eq("price_on_request", true);
  }

  if (params.minPrice != null) {
    query = query.gte("price", params.minPrice);
  }

  if (params.maxPrice != null) {
    query = query.lte("price", params.maxPrice);
  }

  if (params.minAge != null) {
    query = query.gte("age", params.minAge);
  }

  if (params.maxAge != null) {
    query = query.lte("age", params.maxAge);
  }

  if (params.minHeight != null) {
    query = query.gte("height", params.minHeight);
  }

  if (params.maxHeight != null) {
    query = query.lte("height", params.maxHeight);
  }

  return query;
}

function applySort(query: ListingSearchQuery, sort: MarketplaceSortOption): ListingSearchQuery {
  switch (sort) {
    case "oldest":
      return query
        .order("published_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
    case "price-asc":
      return query.order("price", { ascending: true, nullsFirst: false });
    case "price-desc":
      return query.order("price", { ascending: false, nullsFirst: false });
    case "age-asc":
      return query.order("age", { ascending: true });
    case "age-desc":
      return query.order("age", { ascending: false });
    case "height-asc":
      return query.order("height", { ascending: true });
    case "height-desc":
      return query.order("height", { ascending: false });
    case "featured":
      return query
        .order("verified", { ascending: false })
        .order("view_count", { ascending: false, nullsFirst: false })
        .order("published_at", { ascending: false, nullsFirst: false });
    case "newest":
    default:
      return query
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
  }
}

async function resolveStudbookListingIds(
  supabase: SupabaseClient,
  studbook: string
): Promise<string[] | null> {
  const pattern = sanitizeIlikePattern(studbook);
  if (!pattern) {
    return null;
  }

  const { data, error } = await supabase
    .from("pedigree_horses")
    .select("id")
    .ilike("studbook", `%${pattern}%`);

  if (error) {
    return null;
  }

  return (data ?? []).map((row) => row.id as string);
}

export async function searchActiveHorseListings(
  supabase: SupabaseClient,
  params: MarketplaceSearchParams = {}
): Promise<{ result: MarketplaceSearchResult; error?: string }> {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = Math.max(params.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort = params.sort ?? "newest";

  const studbookIds =
    params.studbook?.trim() != null && params.studbook!.trim().length > 0
      ? await resolveStudbookListingIds(supabase, params.studbook!)
      : null;

  if (studbookIds !== null && studbookIds.length === 0) {
    return {
      result: {
        listings: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      },
    };
  }

  let query = supabase
    .from("horse_listings")
    .select("*", { count: "exact" })
    .eq("status", "active");

  if (studbookIds !== null) {
    query = query.in("pedigree_horse_id", studbookIds);
  }

  const useTextSearch = Boolean(params.q?.trim());

  if (useTextSearch) {
    query = query.textSearch("search_vector", params.q!.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  query = applySort(applyListingFilters(query, params), sort).range(from, to);

  let { data, error, count } = await query;

  if (error && useTextSearch && isMissingSearchVectorError(error.message)) {
    let fallbackQuery = supabase
      .from("horse_listings")
      .select("*", { count: "exact" })
      .eq("status", "active");

    if (studbookIds !== null) {
      fallbackQuery = fallbackQuery.in("pedigree_horse_id", studbookIds);
    }

    fallbackQuery = applySort(
      applyListingFilters(applyTextFilter(fallbackQuery, params.q!.trim()), params),
      sort
    ).range(from, to);
    ({ data, error, count } = await fallbackQuery);
  }

  if (error) {
    return {
      result: {
        listings: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      },
      error: error.message,
    };
  }

  const total = count ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

  return {
    result: {
      listings: (data ?? []) as HorseListingRow[],
      total,
      page,
      pageSize,
      totalPages,
    },
  };
}

export async function fetchMarketplaceFilterOptions(
  supabase: SupabaseClient
): Promise<{
  breeds: string[];
  countries: string[];
  disciplines: string[];
  levels: string[];
  error?: string;
}> {
  const { data: levelRows, error } = await supabase
    .from("horse_listings")
    .select("level")
    .eq("status", "active");

  if (error) {
    return {
      breeds: [...getBreedNames()],
      countries: [...COUNTRY_NAMES],
      disciplines: [...DISCIPLINE_LABELS],
      levels: [],
      error: error.message,
    };
  }

  const levels = [
    ...new Set(
      (levelRows ?? [])
        .map((row) => (row.level as string | null)?.trim())
        .filter((value): value is string => Boolean(value))
    ),
  ].sort((a, b) => a.localeCompare(b));

  return {
    breeds: [...getBreedNames()],
    countries: [...COUNTRY_NAMES],
    disciplines: [...DISCIPLINE_LABELS],
    levels,
  };
}

const ALLOWED_SORT: MarketplaceSortOption[] = [
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "age-asc",
  "age-desc",
  "height-asc",
  "height-desc",
  "featured",
];

const ALLOWED_AVAILABILITY: MarketplaceAvailabilityFilter[] = [
  "all",
  "priced",
  "on_request",
];

export function parseMarketplaceSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): MarketplaceSearchParams {
  const read = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const parseNumber = (value: string | undefined) => {
    if (!value?.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const sort = read("sort") as MarketplaceSortOption | undefined;
  const availability = read("availability") as MarketplaceAvailabilityFilter | undefined;

  return {
    q: read("q")?.trim() || undefined,
    breed: read("breed") || undefined,
    country: read("country") || undefined,
    gender: read("gender") || undefined,
    discipline: read("discipline") || undefined,
    color: read("color")?.trim() || undefined,
    level: read("level") || undefined,
    studbook: read("studbook")?.trim() || undefined,
    availability:
      availability && ALLOWED_AVAILABILITY.includes(availability) ? availability : "all",
    verified: read("verified") === "1",
    minPrice: parseNumber(read("minPrice")),
    maxPrice: parseNumber(read("maxPrice")),
    minAge: parseNumber(read("minAge")),
    maxAge: parseNumber(read("maxAge")),
    minHeight: parseNumber(read("minHeight")),
    maxHeight: parseNumber(read("maxHeight")),
    sort: sort && ALLOWED_SORT.includes(sort) ? sort : "newest",
    page: parseNumber(read("page")) ?? 1,
  };
}

export function buildMarketplaceSearchQuery(
  params: MarketplaceSearchParams
): string {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.breed && params.breed !== "All") query.set("breed", params.breed);
  if (params.country && params.country !== "All") query.set("country", params.country);
  if (params.gender && params.gender !== "All") query.set("gender", params.gender);
  if (params.discipline && params.discipline !== "All") {
    query.set("discipline", params.discipline);
  }
  if (params.level && params.level !== "All") query.set("level", params.level);
  if (params.studbook?.trim()) query.set("studbook", params.studbook.trim());
  if (params.availability && params.availability !== "all") {
    query.set("availability", params.availability);
  }
  if (params.color?.trim()) query.set("color", params.color.trim());
  if (params.verified) query.set("verified", "1");
  if (params.minPrice != null) query.set("minPrice", String(params.minPrice));
  if (params.maxPrice != null) query.set("maxPrice", String(params.maxPrice));
  if (params.minAge != null) query.set("minAge", String(params.minAge));
  if (params.maxAge != null) query.set("maxAge", String(params.maxAge));
  if (params.minHeight != null) query.set("minHeight", String(params.minHeight));
  if (params.maxHeight != null) query.set("maxHeight", String(params.maxHeight));
  if (params.sort && params.sort !== "newest") query.set("sort", params.sort);
  if (params.page && params.page > 1) query.set("page", String(params.page));

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}
