import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import Navbar from "@/app/components/navbar/Navbar";
import DemoModeBanner from "@/app/components/demo/DemoModeBanner";
import TrainingDashboardClient from "@/app/components/training/TrainingDashboardClient";
import { createClient } from "@/app/lib/supabase/server";

export default async function TrainingPage() {
  const t = await getTranslations("training");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/training"));
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <DemoModeBanner />
          <Suspense fallback={<div className="py-12 text-sm text-gray-400">{t("dashboard.loadingFallback")}</div>}>
            <TrainingDashboardClient />
          </Suspense>
        </div>
      </main>
    </>
  );
}
