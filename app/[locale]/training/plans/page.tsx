import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import Navbar from "@/app/components/navbar/Navbar";
import TrainingPlansClient from "@/app/components/training/plans/TrainingPlansClient";
import { createClient } from "@/app/lib/supabase/server";

export default async function TrainingPlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/training/plans"));
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] pt-28 pb-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <TrainingPlansClient />
        </div>
      </main>
    </>
  );
}
