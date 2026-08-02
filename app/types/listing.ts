import { DEFAULT_DISCIPLINE } from "@/app/lib/constants/disciplines";

export type HorseGender = "Mare" | "Stallion" | "Gelding";

export const DRESSAGE_LEVELS = [
  "Young Horse / Unbroken",
  "Training",
  "Introductory",
  "Novice",
  "Elementary",
  "Medium",
  "Advanced",
  "Grand Prix",
] as const;

export const SHOW_JUMPING_LEVELS = [
  "Young Horse / Unbroken",
  "Training",
  "1.00 m",
  "1.10 m",
  "1.20 m",
  "1.30 m",
  "1.40 m",
  "1.45 m",
  "1.50 m+",
  "International / Grand Prix",
] as const;

export const DESCRIPTION_MAX_LENGTH = 2000;
export const MAX_LISTING_IMAGES = 12;
export const MAX_LISTING_IMAGE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type ListingImage = {
  id: string;
  previewUrl: string;
  isCover: boolean;
  file?: File;
  existingUrl?: string;
  storagePath?: string;
};

export type ListingFormData = {
  name: string;
  breed: string;
  age: string;
  gender: HorseGender | "";
  color: string;
  height: string;
  country: string;
  discipline: string;
  level: string;
  price: string;
  priceOnRequest: boolean;
  sire: string;
  dam: string;
  damSire: string;
  description: string;
  videoUrl: string;
  sellerName: string;
  email: string;
  phone: string;
  stableName: string;
  confirmed: boolean;
};

export const initialListingFormData: ListingFormData = {
  name: "",
  breed: "",
  age: "",
  gender: "",
  color: "",
  height: "",
  country: "",
  discipline: DEFAULT_DISCIPLINE,
  level: "",
  price: "",
  priceOnRequest: false,
  sire: "",
  dam: "",
  damSire: "",
  description: "",
  videoUrl: "",
  sellerName: "",
  email: "",
  phone: "",
  stableName: "",
  confirmed: false,
};
