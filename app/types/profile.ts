export type UserRole = "user" | "admin";
export type AccountStatus = "active" | "suspended" | "banned";
export type SellerVerificationStatus = "none" | "pending" | "approved" | "rejected" | "more_info";

export type ProfileRow = {
  user_id: string;
  role: UserRole;
  seller_verified: boolean;
  account_status: AccountStatus;
  country: string | null;
  seller_verification_status: SellerVerificationStatus;
  seller_verification_documents: Array<{ name: string; url: string; uploadedAt?: string }>;
  seller_verification_notes: string | null;
  created_at: string;
  updated_at: string;
};
