export type UserRole = "user" | "admin";

export type ProfileRow = {
  user_id: string;
  role: UserRole;
  seller_verified: boolean;
  created_at: string;
  updated_at: string;
};
