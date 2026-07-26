import { Horse } from "@/app/data/horses";

export type SortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "age-asc"
  | "age-desc"
  | "height-asc"
  | "height-desc";

export const DEFAULT_SORT: SortOption = "default";

export function parseHorsePrice(price: string): number {
  const digits = price.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function filterAndSortHorses(
  horses: Horse[],
  options: {
    search: string;
    breed: string;
    country: string;
    gender: string;
    discipline: string;
    verified: boolean;
    minPrice: string;
    maxPrice: string;
    minAge: string;
    maxAge: string;
    minHeight: string;
    maxHeight: string;
    sort: SortOption;
  }
): Horse[] {
  const searchLower = options.search.toLowerCase().trim();
  const minPrice = parseOptionalNumber(options.minPrice);
  const maxPrice = parseOptionalNumber(options.maxPrice);
  const minAge = parseOptionalNumber(options.minAge);
  const maxAge = parseOptionalNumber(options.maxAge);
  const minHeight = parseOptionalNumber(options.minHeight);
  const maxHeight = parseOptionalNumber(options.maxHeight);

  const filtered = horses.filter((horse) => {
    const matchesSearch =
      searchLower === "" ||
      horse.name.toLowerCase().includes(searchLower) ||
      horse.breed.toLowerCase().includes(searchLower) ||
      horse.country.toLowerCase().includes(searchLower);

    const matchesBreed = options.breed === "All" || horse.breed === options.breed;
    const matchesCountry =
      options.country === "All" || horse.country === options.country;
    const matchesGender =
      options.gender === "All" || horse.gender === options.gender;
    const matchesDiscipline =
      options.discipline === "All" || horse.discipline === options.discipline;
    const matchesVerified = !options.verified || horse.verified;

    const horsePrice = parseHorsePrice(horse.price);
    const matchesMinPrice = minPrice === null || horsePrice >= minPrice;
    const matchesMaxPrice = maxPrice === null || horsePrice <= maxPrice;
    const matchesMinAge = minAge === null || horse.age >= minAge;
    const matchesMaxAge = maxAge === null || horse.age <= maxAge;
    const matchesMinHeight = minHeight === null || horse.height >= minHeight;
    const matchesMaxHeight = maxHeight === null || horse.height <= maxHeight;

    return (
      matchesSearch &&
      matchesBreed &&
      matchesCountry &&
      matchesGender &&
      matchesDiscipline &&
      matchesVerified &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesMinAge &&
      matchesMaxAge &&
      matchesMinHeight &&
      matchesMaxHeight
    );
  });

  const sorted = [...filtered];

  switch (options.sort) {
    case "price-asc":
      sorted.sort((a, b) => parseHorsePrice(a.price) - parseHorsePrice(b.price));
      break;
    case "price-desc":
      sorted.sort((a, b) => parseHorsePrice(b.price) - parseHorsePrice(a.price));
      break;
    case "age-asc":
      sorted.sort((a, b) => a.age - b.age);
      break;
    case "age-desc":
      sorted.sort((a, b) => b.age - a.age);
      break;
    case "height-asc":
      sorted.sort((a, b) => a.height - b.height);
      break;
    case "height-desc":
      sorted.sort((a, b) => b.height - a.height);
      break;
    default:
      break;
  }

  return sorted;
}
