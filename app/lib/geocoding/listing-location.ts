import { isValidCoordinate } from "@/app/lib/marketplace/radius";

export type ListingLocationInput = {
  city?: string | null;
  postal_code?: string | null;
  country: string;
};

export type StoredListingLocation = ListingLocationInput & {
  latitude?: number | null;
  longitude?: number | null;
};

export type GeocodeResult = {
  latitude: number;
  longitude: number;
};

function normalizePart(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function listingLocationKey(location: ListingLocationInput): string {
  return [
    normalizePart(location.postal_code).toLowerCase(),
    normalizePart(location.city).toLowerCase(),
    normalizePart(location.country).toLowerCase(),
  ].join("|");
}

export function listingLocationChanged(
  previous: ListingLocationInput | null | undefined,
  next: ListingLocationInput
): boolean {
  if (!previous) {
    return true;
  }

  return listingLocationKey(previous) !== listingLocationKey(next);
}

export function buildListingGeocodeQuery(location: ListingLocationInput): string | null {
  const country = normalizePart(location.country);
  if (!country) {
    return null;
  }

  const city = normalizePart(location.city);
  const postal = normalizePart(location.postal_code);
  const parts = [postal, city, country].filter(Boolean);
  return parts.join(", ");
}

export function hasGeocodableLocation(location: ListingLocationInput): boolean {
  return Boolean(normalizePart(location.country));
}

export function hasStoredCoordinates(location: StoredListingLocation | null | undefined): boolean {
  return isValidCoordinate(location?.latitude ?? undefined, location?.longitude ?? undefined);
}

/** Great-circle distance in kilometres (WGS84). */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}
