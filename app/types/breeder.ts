export type BreederStatus = "active" | "draft" | "archived";

export type BreederRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  description: string;
  country: string;
  city: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  disciplines: string[];
  verified: boolean;
  status: BreederStatus;
  created_at: string;
  updated_at: string;
};

export type BreederCardData = {
  id: string;
  name: string;
  country: string;
  city: string | null;
  description: string;
  disciplines: string[];
  logoUrl: string;
  coverImageUrl: string;
  verified: boolean;
  stallionCount: number;
};

export type BreederProfileDetail = BreederCardData & {
  website: string | null;
  email: string | null;
  phone: string | null;
};

export type BreederFormData = {
  name: string;
  description: string;
  country: string;
  city: string;
  website: string;
  email: string;
  phone: string;
  disciplines: string;
};

export type BreederMediaAction = "keep" | "remove" | "upload";

export type BreederMediaPayload = {
  action: BreederMediaAction;
  existingUrl?: string | null;
  existingStoragePath?: string | null;
};

export type SaveBreederProfilePayload = {
  form: BreederFormData;
  logo: BreederMediaPayload;
  cover: BreederMediaPayload;
};

export type BreederImageFieldState = {
  file: File | null;
  previewUrl: string | null;
  existingUrl: string | null;
  existingStoragePath: string | null;
  removed: boolean;
};

export const initialBreederImageFieldState: BreederImageFieldState = {
  file: null,
  previewUrl: null,
  existingUrl: null,
  existingStoragePath: null,
  removed: false,
};

export const initialBreederFormData: BreederFormData = {
  name: "",
  description: "",
  country: "",
  city: "",
  website: "",
  email: "",
  phone: "",
  disciplines: "",
};
