import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import Navbar from "@/app/components/navbar/Navbar";
import NotificationCenterClient from "@/app/components/events/NotificationCenterClient";
import { createClient } from "@/app/lib/supabase/server";

export default async function NotificationsPage() {
  const t = await getTranslations("notifications");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/notifications"));
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <Suspense fallback={<div className="py-12 text-sm text-gray-400">{t("page.loadingFallback")}</div>}>
            <NotificationCenterClient />
          </Suspense>
        </div>
      </main>
    </>
  );
}
