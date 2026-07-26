import { RECOMMENDATION_DISCLAIMER } from "@/app/lib/breeding-recommendations/constants";
import { StallionRecommendationFilters } from "@/app/types/breeding-recommendations";
import { BREEDING_METHODS, BreedingMethod } from "@/app/types/stallion";

function isBreedingMethod(value: string): value is BreedingMethod {
  return (BREEDING_METHODS as readonly string[]).includes(value);
}

function normalizeBreedingMethodFilter(methods: string[] | undefined): BreedingMethod[] | undefined {
  if (!methods || methods.length === 0) return undefined;

  const canonical = [...new Set(methods.map((item) => item.trim()).filter(isBreedingMethod))];
  if (canonical.length === 0) return undefined;

  const allStandardSelected = BREEDING_METHODS.every((method) => canonical.includes(method));
  if (allStandardSelected) return undefined;

  return canonical;
}

export function normalizeStallionRecommendationFilters(
  filters: StallionRecommendationFilters
): StallionRecommendationFilters {
  const discipline = filters.discipline?.trim() || undefined;
  const studbook = filters.studbook?.trim() || undefined;
  const country = filters.country?.trim() || undefined;
  const studFeeCurrency = filters.studFeeCurrency?.trim() || undefined;
  const breedingMethods = normalizeBreedingMethodFilter(filters.breedingMethods);
  const maxStudFee =
    filters.maxStudFee !== null && filters.maxStudFee !== undefined && filters.maxStudFee > 0
      ? filters.maxStudFee
      : undefined;

  return {
    discipline,
    studbook,
    country,
    maxStudFee,
    studFeeCurrency,
    breedingMethods,
    includeUnavailable: Boolean(filters.includeUnavailable),
    minimumPedigreeConfidence: filters.minimumPedigreeConfidence ?? "any",
  };
}

export function describeActiveStallionRecommendationFilters(
  filters: StallionRecommendationFilters
): string[] {
  const normalized = normalizeStallionRecommendationFilters(filters);
  const parts: string[] = [];

  parts.push(normalized.discipline ? `Discipline: ${normalized.discipline}` : "Discipline: Any");
  parts.push(normalized.studbook ? `Studbook: ${normalized.studbook}` : "Studbook: Any");
  parts.push(normalized.country ? `Country: ${normalized.country}` : "Country: Any");
  parts.push(
    normalized.breedingMethods?.length
      ? `Breeding method(s): ${normalized.breedingMethods.join(", ")}`
      : "Breeding method: Any (no restriction)"
  );

  if (normalized.maxStudFee !== undefined) {
    parts.push(`Maximum stud fee: ${normalized.maxStudFee} ${normalized.studFeeCurrency ?? "EUR"}`);
  }

  if (normalized.minimumPedigreeConfidence && normalized.minimumPedigreeConfidence !== "any") {
    parts.push(`Minimum pedigree confidence: ${normalized.minimumPedigreeConfidence}`);
  }

  if (normalized.includeUnavailable) {
    parts.push("Includes unavailable stallions");
  }

  return parts;
}

export function buildEmptyResultsReason(filters: StallionRecommendationFilters): string {
  const normalized = normalizeStallionRecommendationFilters(filters);
  const restrictive: string[] = [];

  if (normalized.discipline) restrictive.push(`discipline "${normalized.discipline}"`);
  if (normalized.studbook) restrictive.push(`studbook "${normalized.studbook}"`);
  if (normalized.country) restrictive.push(`country "${normalized.country}"`);
  if (normalized.maxStudFee !== undefined) {
    restrictive.push(`maximum stud fee ${normalized.maxStudFee}`);
  }
  if (normalized.breedingMethods?.length) {
    restrictive.push(`breeding method(s): ${normalized.breedingMethods.join(", ")}`);
  }
  if (normalized.minimumPedigreeConfidence && normalized.minimumPedigreeConfidence !== "any") {
    restrictive.push(`minimum pedigree confidence "${normalized.minimumPedigreeConfidence}"`);
  }
  if (!normalized.includeUnavailable) {
    restrictive.push("availability limited to available/limited stallions");
  }

  if (restrictive.length === 0) {
    return "No active stallions with pedigree linkage matched the current mare and default eligibility rules.";
  }

  const studbookNote = normalized.studbook
    ? " Stallions without a listed studbook are excluded when a studbook filter is active."
    : "";
  const methodNote = normalized.breedingMethods?.length
    ? " Stallions without documented breeding methods are excluded when breeding-method filters are active."
    : "";

  return `No eligible stallions matched the active filters (${restrictive.join("; ")}).${studbookNote}${methodNote} Try removing or adjusting filters.`;
}

export { RECOMMENDATION_DISCLAIMER };
