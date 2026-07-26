export type UserRole = "user" | "admin";

export type ProfileRow = {
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};
