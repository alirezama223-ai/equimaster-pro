import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import Navbar from "@/app/components/navbar/Navbar";
import MfaManager from "@/app/components/account/MfaManager";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountMfaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/account/mfa"));
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <MfaManager />
        </div>
      </main>
    </>
  );
}
