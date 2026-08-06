export type SellerVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type HorseVerificationStatus = "unverified" | "documents_submitted" | "verified";

export type VerificationDocumentStatus = "pending" | "approved" | "rejected";

export type VerificationSubjectType = "seller" | "horse" | "document";

export type SellerDocumentType =
  | "government_id"
  | "business_registration"
  | "address_proof"
  | "phone_verification"
  | "selfie";

export type HorseDocumentType =
  | "passport"
  | "fei_id"
  | "studbook"
  | "vaccination"
  | "vet_check"
  | "x_rays"
  | "ownership_proof";

export type VerificationDocumentType = SellerDocumentType | HorseDocumentType;

export type VerificationDocumentRow = {
  id: string;
  owner_user_id: string;
  horse_listing_id: string | null;
  subject_type: "seller" | "horse";
  document_type: VerificationDocumentType;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  status: VerificationDocumentStatus;
  notes: string | null;
  uploaded_at: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VerificationAuditLogRow = {
  id: string;
  actor_user_id: string | null;
  subject_user_id: string | null;
  horse_listing_id: string | null;
  document_id: string | null;
  subject_type: VerificationSubjectType;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SellerVerificationSnapshot = {
  status: SellerVerificationStatus;
  sellerVerified: boolean;
  phoneVerified: boolean;
  rejectionReason: string | null;
  notes: string | null;
  verifiedAt: string | null;
  documents: VerificationDocumentRow[];
};

export type HorseVerificationSnapshot = {
  listingId: string;
  listingName: string;
  status: HorseVerificationStatus;
  horseVerified: boolean;
  verifiedAt: string | null;
  documents: VerificationDocumentRow[];
};

export type AdminVerificationQueueItem = {
  userId: string;
  sellerReference: string;
  status: SellerVerificationStatus;
  sellerVerified: boolean;
  phoneVerified: boolean;
  rejectionReason: string | null;
  notes: string | null;
  verifiedAt: string | null;
  documentCount: number;
  pendingDocumentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminHorseVerificationQueueItem = {
  listingId: string;
  listingName: string;
  sellerReference: string;
  ownerUserId: string;
  status: HorseVerificationStatus;
  horseVerified: boolean;
  verifiedAt: string | null;
  documentCount: number;
  pendingDocumentCount: number;
  updatedAt: string;
};

export type AdminVerificationReviewAction = "approve" | "reject" | "request_info";

export const REQUIRED_SELLER_DOCUMENTS: SellerDocumentType[] = [
  "government_id",
  "address_proof",
  "phone_verification",
];

export const OPTIONAL_SELLER_DOCUMENTS: SellerDocumentType[] = [
  "business_registration",
  "selfie",
];

export const HORSE_DOCUMENT_TYPES: HorseDocumentType[] = [
  "passport",
  "fei_id",
  "studbook",
  "vaccination",
  "vet_check",
  "x_rays",
  "ownership_proof",
];

export const SELLER_DOCUMENT_TYPES: SellerDocumentType[] = [
  ...REQUIRED_SELLER_DOCUMENTS,
  ...OPTIONAL_SELLER_DOCUMENTS,
];
