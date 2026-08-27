import { resolveOwnedStallionStoragePath } from "@/app/lib/stallion-image-storage";
import { ListingImage } from "@/app/types/listing";
import {
  StallionAvailability,
  StallionCardData,
  StallionDetail,
  StallionRow,
} from "@/app/types/stallion";
import { BreederRow } from "@/app/types/breeder";
import { rowToBreeder } from "@/app/lib/breeders";

const PLACEHOLDER_IMAGE = "/emi.jpg";

export function isStallionUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function normalizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .filter((item): item is string => typeof item === "string")
    .map((url) => url.trim())
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

export function normalizeBreedingMethods(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function parseImageUrlsInput(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getStallionCoverUrl(row: StallionRow): string {
  if (row.cover_image_url?.trim()) return row.cover_image_url.trim();
  if (row.image_urls.length > 0) return row.image_urls[0];
  return PLACEHOLDER_IMAGE;
}

export function getStallionDisplayImages(row: StallionRow): string[] {
  const urls = normalizeImageUrls(row.image_urls);
  if (urls.length === 0) {
    return row.cover_image_url ? [row.cover_image_url] : [PLACEHOLDER_IMAGE];
  }
  if (!row.cover_image_url) return urls;
  const remaining = urls.filter((url) => url !== row.cover_image_url);
  return [row.cover_image_url, ...remaining];
}

export function formatStudFee(row: Pick<StallionRow, "stud_fee" | "stud_fee_currency">): string {
  if (row.stud_fee === null) return "On request";
  const currency = row.stud_fee_currency || "EUR";
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${Number(row.stud_fee).toLocaleString("en-US")}`;
}

export function getStallionAge(birthYear: number | null): number | null {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
}

export function stallionImagesFromRow(row: StallionRow, ownerId: string): ListingImage[] {
  const urls = getStallionDisplayImages(row);
  const coverUrl = row.cover_image_url?.trim() || urls[0] || null;

  return urls.map((url, index) => ({
    id: `existing-${index}-${url}`,
    previewUrl: url,
    isCover: coverUrl ? url === coverUrl : index === 0,
    existingUrl: url,
    storagePath: resolveOwnedStallionStoragePath(url, ownerId) ?? undefined,
  }));
}

export function rowToStallion(row: Record<string, unknown>): StallionRow {
  return {
    ...(row as StallionRow),
    image_urls: normalizeImageUrls(row.image_urls),
    breeding_methods: normalizeBreedingMethods(row.breeding_methods),
  };
}

export function stallionRowToCard(
  row: StallionRow,
  breeder: Pick<BreederRow, "id" | "name">
): StallionCardData {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    studbook: row.studbook,
    birthYear: row.birth_year,
    color: row.color,
    height: row.height,
    country: row.country,
    discipline: row.discipline,
    competitionLevel: row.competition_level,
    sire: row.sire,
    dam: row.dam,
    damSire: row.dam_sire,
    studFee: row.stud_fee,
    studFeeCurrency: row.stud_fee_currency,
    studFeeLabel: formatStudFee(row),
    availability: row.availability,
    coverImageUrl: getStallionCoverUrl(row),
    verified: row.verified,
    breederId: breeder.id,
    breederName: breeder.name,
  };
}

export function stallionRowToDetail(
  row: StallionRow,
  breeder: BreederRow
): StallionDetail {
  return {
    ...stallionRowToCard(row, breeder),
    images: getStallionDisplayImages(row),
    breedingMethods: row.breeding_methods,
    description: row.description,
    performance: row.performance,
    breedingHighlights: row.breeding_highlights,
    breeder: {
      id: breeder.id,
      name: breeder.name,
      country: breeder.country,
      city: breeder.city,
      website: breeder.website,
      email: breeder.email,
      phone: breeder.phone,
      verified: breeder.verified,
    },
  };
}

export type StallionFilterState = {
  search: string;
  breed: string;
  discipline: string;
  country: string;
  availability: string;
  sire: string;
  damSire: string;
  minStudFee: string;
  maxStudFee: string;
  minBirthYear: string;
  maxBirthYear: string;
};

export function filterStallionCards(
  stallions: StallionCardData[],
  filters: StallionFilterState
): StallionCardData[] {
  return stallions.filter((stallion) => {
    if (filters.search.trim()) {
      const query = filters.search.trim().toLowerCase();
      const haystack = [
        stallion.name,
        stallion.breed,
        stallion.studbook ?? "",
        stallion.breederName,
        stallion.sire,
        stallion.damSire,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filters.breed !== "All" && stallion.breed !== filters.breed) return false;
    if (filters.discipline !== "All" && stallion.discipline !== filters.discipline) return false;
    if (filters.country !== "All" && stallion.country !== filters.country) return false;
    if (filters.availability !== "All" && stallion.availability !== filters.availability) {
      return false;
    }

    if (filters.sire.trim() && !stallion.sire.toLowerCase().includes(filters.sire.trim().toLowerCase())) {
      return false;
    }

    if (
      filters.damSire.trim() &&
      !stallion.damSire.toLowerCase().includes(filters.damSire.trim().toLowerCase())
    ) {
      return false;
    }

    if (stallion.birthYear !== null) {
      const minYear = filters.minBirthYear ? Number(filters.minBirthYear) : null;
      const maxYear = filters.maxBirthYear ? Number(filters.maxBirthYear) : null;
      if (minYear !== null && !Number.isNaN(minYear) && stallion.birthYear < minYear) return false;
      if (maxYear !== null && !Number.isNaN(maxYear) && stallion.birthYear > maxYear) return false;
    }

    const minFee = filters.minStudFee ? Number(filters.minStudFee) : null;
    const maxFee = filters.maxStudFee ? Number(filters.maxStudFee) : null;
    if (minFee !== null && !Number.isNaN(minFee)) {
      if (stallion.studFee === null || stallion.studFee < minFee) return false;
    }
    if (maxFee !== null && !Number.isNaN(maxFee)) {
      if (stallion.studFee === null || stallion.studFee > maxFee) return false;
    }

    return true;
  });
}

export function availabilityBadgeClass(availability: StallionAvailability): string {
  switch (availability) {
    case "available":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case "limited":
      return "bg-yellow-500/20 text-yellow-200 border-yellow-500/30";
    case "booked":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
}

export function mapBreederJoin<T extends { breeders?: BreederRow | BreederRow[] | null }>(
  row: T
): BreederRow | null {
  if (!row.breeders) return null;
  if (Array.isArray(row.breeders)) {
    return row.breeders[0] ? rowToBreeder(row.breeders[0] as unknown as Record<string, unknown>) : null;
  }
  return rowToBreeder(row.breeders as unknown as Record<string, unknown>);
}
