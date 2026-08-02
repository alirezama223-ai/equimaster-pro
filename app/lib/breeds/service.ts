import { HORSE_BREEDS } from "@/app/lib/breeds/data";
import type {
  BreedCategory,
  BreedSelectOption,
  BreedSportType,
  HorseBreed,
} from "@/app/lib/breeds/types";

const breedsByName = new Map<string, HorseBreed>(
  HORSE_BREEDS.map((breed) => [breed.name.toLowerCase(), breed])
);

const breedsById = new Map<string, HorseBreed>(HORSE_BREEDS.map((breed) => [breed.id, breed]));

/** All active horse breeds, sorted alphabetically by name. */
export function getActiveBreeds(): readonly HorseBreed[] {
  return HORSE_BREEDS.filter((breed) => breed.is_active);
}

/** Canonical breed names for filters and validation. */
export function getBreedNames(): readonly string[] {
  return getActiveBreeds().map((breed) => breed.name);
}

export function findBreedByName(name: string): HorseBreed | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return breedsByName.get(trimmed.toLowerCase());
}

export function findBreedById(id: string): HorseBreed | undefined {
  const normalized = id.trim().toLowerCase();
  if (!normalized) return undefined;
  return breedsById.get(normalized);
}

export function isValidBreedName(name: string): boolean {
  return Boolean(findBreedByName(name));
}

export function getBreedsByCategory(category: BreedCategory): readonly HorseBreed[] {
  return getActiveBreeds().filter((breed) => breed.category === category);
}

export function getBreedsBySportType(sportType: BreedSportType): readonly HorseBreed[] {
  return getActiveBreeds().filter((breed) => breed.sport_type === sportType);
}

export function formatBreedLabel(breed: HorseBreed): string {
  return breed.name;
}

export function getBreedSelectOptions(): BreedSelectOption[] {
  return getActiveBreeds().map((breed) => ({
    value: breed.name,
    label: breed.name,
    searchText: [breed.name, breed.category, breed.origin_country, breed.sport_type].join(" "),
  }));
}

export { HORSE_BREEDS };
export type { BreedCategory, BreedSelectOption, BreedSportType, HorseBreed };
