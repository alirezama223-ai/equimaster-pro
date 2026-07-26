import { BreederCardData, BreederRow } from "@/app/types/breeder";

const PLACEHOLDER_LOGO = "/emi.jpg";

export function isBreederUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function normalizeDisciplines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function parseDisciplinesInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getBreederLogoUrl(row: BreederRow): string {
  return row.logo_url?.trim() || row.cover_image_url?.trim() || PLACEHOLDER_LOGO;
}

export function getBreederCoverUrl(row: BreederRow): string {
  return row.cover_image_url?.trim() || row.logo_url?.trim() || PLACEHOLDER_LOGO;
}

export function breederRowToCard(row: BreederRow, stallionCount = 0): BreederCardData {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    city: row.city,
    description: row.description,
    disciplines: normalizeDisciplines(row.disciplines),
    logoUrl: getBreederLogoUrl(row),
    coverImageUrl: getBreederCoverUrl(row),
    verified: row.verified,
    stallionCount,
  };
}

export function rowToBreeder(row: Record<string, unknown>): BreederRow {
  return {
    ...(row as BreederRow),
    disciplines: normalizeDisciplines(row.disciplines),
  };
}
