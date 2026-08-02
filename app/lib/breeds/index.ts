export {
  findBreedById,
  findBreedByName,
  formatBreedLabel,
  getActiveBreeds,
  getBreedNames,
  getBreedsByCategory,
  getBreedsBySportType,
  getBreedSelectOptions,
  HORSE_BREEDS,
  isValidBreedName,
} from "@/app/lib/breeds/service";

export type {
  BreedCategory,
  BreedSelectOption,
  BreedSportType,
  HorseBreed,
} from "@/app/lib/breeds/types";
