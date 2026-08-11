import { geocodeListingLocation } from "@/app/lib/geocoding/geocode";
import {
  hasGeocodableLocation,
  hasStoredCoordinates,
  listingLocationChanged,
  listingLocationKey,
  type ListingLocationInput,
  type StoredListingLocation,
} from "@/app/lib/geocoding/listing-location";

export type ListingCoordinateFields = {
  latitude: number | null;
  longitude: number | null;
};

export function normalizeListingLocationFields(form: {
  city?: string;
  postalCode?: string;
  country: string;
}): ListingLocationInput {
  return {
    city: form.city?.trim() || null,
    postal_code: form.postalCode?.trim() || null,
    country: form.country.trim(),
  };
}

/**
 * Resolve coordinates for a listing save.
 * Preserves existing lat/lng when the normalized location key is unchanged.
 * Never throws — geocoding failures return null coords or prior coords when unchanged.
 */
export async function resolveListingCoordinates(
  existing: StoredListingLocation | null | undefined,
  next: ListingLocationInput
): Promise<ListingCoordinateFields> {
  if (!hasGeocodableLocation(next)) {
    return { latitude: null, longitude: null };
  }

  const unchanged =
    existing != null &&
    !listingLocationChanged(existing, next) &&
    hasStoredCoordinates(existing);

  if (unchanged) {
    return {
      latitude: existing!.latitude ?? null,
      longitude: existing!.longitude ?? null,
    };
  }

  const geocoded = await geocodeListingLocation(next);
  if (geocoded) {
    return geocoded;
  }

  if (
    existing != null &&
    listingLocationKey(existing) === listingLocationKey(next) &&
    hasStoredCoordinates(existing)
  ) {
    return {
      latitude: existing.latitude ?? null,
      longitude: existing.longitude ?? null,
    };
  }

  return { latitude: null, longitude: null };
}
