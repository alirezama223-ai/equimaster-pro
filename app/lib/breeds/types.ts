export type BreedCategory =
  | "warmblood"
  | "thoroughbred"
  | "arabian"
  | "pony"
  | "draft"
  | "gaited"
  | "iberian"
  | "baroque"
  | "coldblood"
  | "rare_regional"
  | "miniature"
  | "sport_horse_registry"
  | "crossbreed"
  | "other";

export type BreedSportType =
  | "sport"
  | "riding"
  | "driving"
  | "racing"
  | "pony"
  | "draft"
  | "gaited"
  | "dual_purpose"
  | "ornamental"
  | "general";

export type HorseBreed = {
  /** Stable slug for future i18n keys (e.g. breeds.hanoverian). */
  id: string;
  /** Canonical English name stored in listings and profiles. */
  name: string;
  category: BreedCategory;
  origin_country: string;
  sport_type: BreedSportType;
  is_active: boolean;
  sort_order: number;
};

export type BreedSelectOption = {
  value: string;
  label: string;
  searchText: string;
};
