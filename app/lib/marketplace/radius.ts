/** Allowed marketplace search radius values in kilometres. */
export const MARKETPLACE_RADIUS_KM_OPTIONS = [25, 50, 100, 200, 300, 500] as const;

export type MarketplaceRadiusKm = (typeof MARKETPLACE_RADIUS_KM_OPTIONS)[number];

export function isAllowedRadiusKm(value: number): value is MarketplaceRadiusKm {
  return (MARKETPLACE_RADIUS_KM_OPTIONS as readonly number[]).includes(value);
}

export function parseRadiusKmParam(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return isAllowedRadiusKm(parsed) ? parsed : undefined;
}

export function isValidCoordinate(lat: number | undefined, lng: number | undefined): boolean {
  if (lat == null || lng == null) {
    return false;
  }

  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function shouldUseRadiusSearch(params: {
  radiusKm?: number;
  originLat?: number;
  originLng?: number;
}): boolean {
  return (
    params.radiusKm != null &&
    params.radiusKm > 0 &&
    isValidCoordinate(params.originLat, params.originLng)
  );
}
