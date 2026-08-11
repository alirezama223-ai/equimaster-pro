import {
  buildListingGeocodeQuery,
  type GeocodeResult,
  type ListingLocationInput,
} from "@/app/lib/geocoding/listing-location";

const DEFAULT_TIMEOUT_MS = 8_000;

function parseCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toGeocodeResult(lat: unknown, lng: unknown): GeocodeResult | null {
  const latitude = parseCoordinate(lat);
  const longitude = parseCoordinate(lng);

  if (
    latitude == null ||
    longitude == null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeViaNominatim(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    addressdetails: "0",
  });

  const userAgent =
    process.env.GEOCODING_USER_AGENT?.trim() ||
    "EquiMaster-Pro/1.0 (marketplace listing geocoding)";

  const response = await fetchWithTimeout(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const first = payload[0];
  if (!first) {
    return null;
  }

  return toGeocodeResult(first.lat, first.lon);
}

async function geocodeViaMapbox(query: string): Promise<GeocodeResult | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) {
    console.warn("[geocode] MAPBOX_ACCESS_TOKEN is not configured.");
    return null;
  }

  const params = new URLSearchParams({
    access_token: token,
    limit: "1",
  });

  const response = await fetchWithTimeout(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    features?: Array<{ center?: [number, number] }>;
  };

  const center = payload.features?.[0]?.center;
  if (!center || center.length < 2) {
    return null;
  }

  return toGeocodeResult(center[1], center[0]);
}

/**
 * Server-side geocoding for listing locations.
 * Provider: `GEOCODING_PROVIDER` = `nominatim` (default, no API key) or `mapbox`.
 */
export async function geocodeListingLocation(
  location: ListingLocationInput
): Promise<GeocodeResult | null> {
  const query = buildListingGeocodeQuery(location);
  if (!query) {
    return null;
  }

  const provider = (process.env.GEOCODING_PROVIDER?.trim().toLowerCase() || "nominatim") as
    | "nominatim"
    | "mapbox";

  try {
    if (provider === "mapbox") {
      return await geocodeViaMapbox(query);
    }

    return await geocodeViaNominatim(query);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[geocodeListingLocation] request failed", { provider, message });
    return null;
  }
}
