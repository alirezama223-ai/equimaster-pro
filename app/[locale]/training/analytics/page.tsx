import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import Navbar from "@/app/components/navbar/Navbar";
import DemoModeBanner from "@/app/components/demo/DemoModeBanner";
import HorseAnalyticsDashboardClient from "@/app/components/training/analytics/HorseAnalyticsDashboardClient";
import { createClient } from "@/app/lib/supabase/server";

export default async function TrainingAnalyticsPage() {
  const t = await getTranslations("training");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/training/analytics"));
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <DemoModeBanner />
          <Suspense fallback={<div className="py-12 text-sm text-gray-400">{t("analytics.loadingFallback")}</div>}>
            <HorseAnalyticsDashboardClient />
          </Suspense>
        </div>
      </main>
    </>
  );
}
