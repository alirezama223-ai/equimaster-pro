import type { SupabaseClient } from "@supabase/supabase-js";
import { hasGeocodableLocation, type ListingLocationInput } from "@/app/lib/geocoding/listing-location";
import { resolveListingCoordinates } from "@/app/lib/geocoding/resolve-listing-coordinates";

export type BackfillListingCoordinatesResult = {
  scanned: number;
  updated: number;
  skipped: number;
  failed: number;
  dryRun: boolean;
  errors: string[];
};

type ListingRow = {
  id: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

function isBackfillCandidate(row: ListingRow): row is ListingRow & { country: string } {
  if (!row.country?.trim()) {
    return false;
  }

  if (row.latitude != null && row.longitude != null) {
    return false;
  }

  return Boolean(row.city?.trim() || row.postal_code?.trim());
}

function toLocation(row: ListingRow & { country: string }): ListingLocationInput {
  return {
    city: row.city,
    postal_code: row.postal_code,
    country: row.country,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Controlled batch backfill for listing coordinates.
 * Does not run automatically — invoke from an admin server action or ops script.
 */
export async function backfillListingCoordinatesBatch(
  supabase: SupabaseClient,
  options?: { limit?: number; dryRun?: boolean; delayMs?: number }
): Promise<BackfillListingCoordinatesResult> {
  const limit = Math.min(Math.max(options?.limit ?? 25, 1), 100);
  const dryRun = options?.dryRun ?? false;
  const delayMs = Math.max(options?.delayMs ?? 1_100, 0);

  const { data, error } = await supabase
    .from("horse_listings")
    .select("id, city, postal_code, country, latitude, longitude")
    .or("latitude.is.null,longitude.is.null")
    .not("country", "is", null)
    .order("updated_at", { ascending: true })
    .limit(limit * 4);

  if (error) {
    return {
      scanned: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      dryRun,
      errors: [error.message],
    };
  }

  const candidates = ((data ?? []) as ListingRow[])
    .filter(isBackfillCandidate)
    .slice(0, limit);

  const result: BackfillListingCoordinatesResult = {
    scanned: candidates.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun,
    errors: [],
  };

  for (const row of candidates) {
    const location = toLocation(row);

    if (!hasGeocodableLocation(location)) {
      result.skipped += 1;
      continue;
    }

    const coordinates = await resolveListingCoordinates(row, location);

    if (coordinates.latitude == null || coordinates.longitude == null) {
      result.failed += 1;
      result.errors.push(`Listing ${row.id}: geocoding returned no coordinates.`);
      if (delayMs > 0) {
        await sleep(delayMs);
      }
      continue;
    }

    if (dryRun) {
      result.updated += 1;
    } else {
      const { error: updateError } = await supabase
        .from("horse_listings")
        .update({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        })
        .eq("id", row.id);

      if (updateError) {
        result.failed += 1;
        result.errors.push(`Listing ${row.id}: ${updateError.message}`);
      } else {
        result.updated += 1;
      }
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return result;
}
