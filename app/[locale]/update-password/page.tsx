import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import UpdatePasswordForm from "@/app/components/auth/UpdatePasswordForm";
import FadeUp from "@/app/components/animations/FadeUp";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.updatePassword");

  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default async function UpdatePasswordPage() {
  const t = await getTranslations("auth.updatePassword");

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <Suspense
              fallback={
                <div className="rounded-3xl bg-[#111C2E] border border-gray-800 p-10 text-center text-gray-400">
                  {t("loading")}
                </div>
              }
            >
              <UpdatePasswordForm />
            </Suspense>
          </FadeUp>
        </div>
      </main>
    </>
  );
}
