import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import Navbar from "@/app/components/navbar/Navbar";
import DemoModeBanner from "@/app/components/demo/DemoModeBanner";
import HorseTimelineClient from "@/app/components/events/HorseTimelineClient";
import { createClient } from "@/app/lib/supabase/server";

export default async function TrainingTimelinePage() {
  const t = await getTranslations("events");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/training/timeline"));
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <DemoModeBanner />
          <Suspense fallback={<div className="py-12 text-sm text-gray-400">{t("timeline.loadingFallback")}</div>}>
            <HorseTimelineClient />
          </Suspense>
        </div>
      </main>
    </>
  );
}
