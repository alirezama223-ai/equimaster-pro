import { DEFAULT_DISCIPLINE } from "@/app/lib/constants/disciplines";

export type StallionStatus = "active" | "draft" | "archived";
export type StallionAvailability = "available" | "limited" | "booked" | "retired";

export const STALLION_AVAILABILITY_LABELS: Record<StallionAvailability, string> = {
  available: "Available",
  limited: "Limited",
  booked: "Fully Booked",
  retired: "Retired",
};

export const BREEDING_METHODS = [
  "Fresh semen",
  "Chilled semen",
  "Frozen semen",
  "Natural covering",
] as const;

export type BreedingMethod = (typeof BREEDING_METHODS)[number];

export type StallionRow = {
  id: string;
  owner_id: string;
  breeder_id: string;
  name: string;
  breed: string;
  studbook: string | null;
  birth_year: number | null;
  color: string;
  height: number | null;
  country: string;
  discipline: string;
  competition_level: string;
  sire: string;
  dam: string;
  dam_sire: string;
  stud_fee: number | null;
  studFeeCurrency: string;
  stud_fee_currency: string;
  availability: StallionAvailability;
  breeding_methods: string[];
  description: string;
  performance: string;
  breeding_highlights: string;
  image_urls: string[];
  cover_image_url: string | null;
  verified: boolean;
  status: StallionStatus;
  pedigree_horse_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StallionCardData = {
  id: string;
  name: string;
  breed: string;
  studbook: string | null;
  birthYear: number | null;
  color: string;
  height: number | null;
  country: string;
  discipline: string;
  competitionLevel: string;
  sire: string;
  dam: string;
  damSire: string;
  studFee: number | null;
  studFeeLabel: string;
  availability: StallionAvailability;
  coverImageUrl: string;
  verified: boolean;
  breederId: string;
  breederName: string;
};

export type StallionDetail = StallionCardData & {
  images: string[];
  breedingMethods: string[];
  description: string;
  performance: string;
  breedingHighlights: string;
  breeder: {
    id: string;
    name: string;
    country: string;
    city: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    verified: boolean;
  };
};

export type StallionFormData = {
  name: string;
  breed: string;
  studbook: string;
  birthYear: string;
  color: string;
  height: string;
  country: string;
  discipline: string;
  competitionLevel: string;
  sire: string;
  dam: string;
  damSire: string;
  studFee: string;
  studFeeCurrency: string;
  availability: StallionAvailability;
  breedingMethods: string[];
  description: string;
  performance: string;
  breedingHighlights: string;
};

export type SaveStallionImagePayload = {
  isCover: boolean;
  isNew: boolean;
  existingUrl?: string;
  storagePath?: string;
  newFileIndex?: number;
  name: string;
  size: number;
  type: string;
};

export type CreateStallionPayload = {
  form: StallionFormData;
  images: Array<{
    isCover: boolean;
    name: string;
    size: number;
    type: string;
  }>;
};

export type UpdateStallionPayload = {
  stallionId: string;
  form: StallionFormData;
  images: SaveStallionImagePayload[];
  removedImagePaths: string[];
};

export const initialStallionFormData: StallionFormData = {
  name: "",
  breed: "",
  studbook: "",
  birthYear: "",
  color: "",
  height: "",
  country: "",
  discipline: DEFAULT_DISCIPLINE,
  competitionLevel: "",
  sire: "",
  dam: "",
  damSire: "",
  studFee: "",
  studFeeCurrency: "EUR",
  availability: "available",
  breedingMethods: [],
  description: "",
  performance: "",
  breedingHighlights: "",
};
