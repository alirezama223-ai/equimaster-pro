export type Horse = {
  id: number;
  slug: string;
  listingUuid?: string;

  name: string;
  breed: string;

  age: number;
  height: number;

  gender: "Mare" | "Stallion" | "Gelding";

  color: string;
  country: string;

  discipline: string;
  level: string;

  price: string;
  verified: boolean;
  sellerVerified?: boolean;
  horseVerificationStatus?: import("@/app/types/verification").HorseVerificationStatus;
  horseVerifiedAt?: string | null;
  sellerVerifiedAt?: string | null;

  description: string;

  sire: string;
  dam: string;
  damSire?: string;

  images: string[];

  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  stableName?: string;
  videoUrl?: string;
  /** Present on radius search results when origin + listing coordinates are known. */
  distanceKm?: number;
};

export const horses: Horse[] = [
  {
    id: 1,
    slug: "emerald-star-z",
    name: "Emerald Star Z",
    breed: "Hanoverian",
    age: 6,
    height: 167,
    gender: "Mare",
    color: "Bay",
    country: "Germany",
    discipline: "Show Jumping",
    level: "1.40 m",
    price: "€32,000",
    verified: true,
    description:
      "Exceptional young sport horse with outstanding rideability and scope.",
    sire: "Emerald van't Ruytershof",
    dam: "Baloubet Dream",
    images: [
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
    ],
  },

  {
    id: 2,
    slug: "casco-blue",
    name: "Casco Blue",
    breed: "Oldenburg",
    age: 5,
    height: 170,
    gender: "Stallion",
    color: "Grey",
    country: "Belgium",
    discipline: "Show Jumping",
    level: "1.35 m",
    price: "€45,000",
    verified: true,
    description:
      "Modern stallion with excellent reflexes and careful technique.",
    sire: "Casco Blue PS",
    dam: "Chacco Lady",
    images: [
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
    ],
  },

  {
    id: 3,
    slug: "tobago-star",
    name: "Tobago Star",
    breed: "Zangersheide",
    age: 7,
    height: 171,
    gender: "Gelding",
    color: "Chestnut",
    country: "Netherlands",
    discipline: "Show Jumping",
    level: "1.45 m",
    price: "€58,000",
    verified: true,
    description:
      "Experienced competition horse for ambitious riders.",
    sire: "Tobago Z",
    dam: "Cornet Girl",
    images: [
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
    ],
  },

  {
    id: 4,
    slug: "united-dream",
    name: "United Dream",
    breed: "KWPN",
    age: 5,
    height: 168,
    gender: "Mare",
    color: "Bay",
    country: "France",
    discipline: "Show Jumping",
    level: "1.20 m",
    price: "€39,000",
    verified: false,
    description:
      "Young prospect with careful jump and excellent character.",
    sire: "United Touch S",
    dam: "Dream Lady",
    images: [
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
    ],
  },

  {
    id: 5,
    slug: "casall-queen",
    name: "Casall Queen",
    breed: "Holsteiner",
    age: 8,
    height: 169,
    gender: "Mare",
    color: "Grey",
    country: "Germany",
    discipline: "Show Jumping",
    level: "1.50 m",
    price: "€74,000",
    verified: true,
    description:
      "International mare with exceptional pedigree and scope.",
    sire: "Casall",
    dam: "Quidam Queen",
    images: [
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
    ],
  },

  {
    id: 6,
    slug: "chacfly-lady",
    name: "Chacfly Lady",
    breed: "Oldenburg",
    age: 6,
    height: 168,
    gender: "Mare",
    color: "Bay",
    country: "Netherlands",
    discipline: "Show Jumping",
    level: "1.35 m",
    price: "€54,000",
    verified: true,
    description:
      "Athletic mare suitable for sport and breeding.",
    sire: "Chacfly PS",
    dam: "Lady Balou",
    images: [
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
      "/emi.jpg",
    ],
  },
];

export function getHorseById(id: number) {
  return horses.find((horse) => horse.id === id);
}

export function getHorseBySlug(slug: string) {
  return horses.find((horse) => horse.slug === slug);
}

export function getRelatedHorses(currentId: number) {
  return horses.filter((horse) => horse.id !== currentId).slice(0, 3);
}