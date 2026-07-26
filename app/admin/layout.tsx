import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { isCurrentUserAdmin } from "@/app/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/account");
  }

  return children;
}
