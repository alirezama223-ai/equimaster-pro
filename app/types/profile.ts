export type UserRole = "user" | "admin";
export type AccountStatus = "active" | "suspended" | "banned";
export type SellerVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type ProfileRow = {
  user_id: string;
  role: UserRole;
  seller_verified: boolean;
  account_status: AccountStatus;
  country: string | null;
  seller_verification_status: SellerVerificationStatus;
  seller_verification_documents: Array<{ name: string; url: string; uploadedAt?: string }>;
  seller_verification_notes: string | null;
  phone_verified: boolean;
  seller_rejection_reason: string | null;
  seller_verified_at: string | null;
  seller_verified_by: string | null;
  created_at: string;
  updated_at: string;
};
