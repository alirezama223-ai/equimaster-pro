export type PedigreeSex = "stallion" | "mare" | "gelding" | "unknown";

export type PedigreeHorseRow = {
  id: string;
  name: string;
  normalized_name: string;
  sex: PedigreeSex;
  birth_year: number | null;
  breed: string | null;
  studbook: string | null;
  registration_number: string | null;
  color: string | null;
  country: string | null;
  sire_id: string | null;
  dam_id: string | null;
  external_reference: string | null;
  description: string | null;
  verified: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PedigreeHorse = {
  id: string;
  name: string;
  normalizedName: string;
  sex: PedigreeSex;
  birthYear: number | null;
  breed: string | null;
  studbook: string | null;
  registrationNumber: string | null;
  color: string | null;
  country: string | null;
  sireId: string | null;
  damId: string | null;
  externalReference: string | null;
  description: string | null;
  verified: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PedigreeTreeNode = {
  id: string | null;
  name: string;
  sex: PedigreeSex;
  birthYear: number | null;
  verified: boolean;
  sire: PedigreeTreeNode | null;
  dam: PedigreeTreeNode | null;
};

export type PedigreeSearchResult = {
  id: string;
  name: string;
  sex: PedigreeSex;
  birthYear: number | null;
  studbook: string | null;
  registrationNumber: string | null;
  sireName: string | null;
  damSireName: string | null;
  verified: boolean;
  coverImageUrl: string | null;
};

export type PedigreeProfileLinks = {
  listingId: string | null;
  stallionId: string | null;
};

export type PedigreeTextFields = {
  name: string;
  sire: string;
  dam: string;
  damSire: string;
};

export type PedigreeSubjectInput = PedigreeTextFields & {
  sex: PedigreeSex;
  birthYear?: number | null;
  breed?: string | null;
  studbook?: string | null;
  registrationNumber?: string | null;
  color?: string | null;
  country?: string | null;
  existingPedigreeHorseId?: string | null;
};
