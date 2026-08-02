import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { createClient } from "@/app/lib/supabase/server";
import { isCurrentUserAdmin } from "@/app/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/admin"));
  }

  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/account");
  }

  return children;
}
