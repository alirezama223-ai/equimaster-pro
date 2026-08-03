import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import SignupForm from "@/app/components/auth/SignupForm";
import FadeUp from "@/app/components/animations/FadeUp";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";

export async function generateMetadata() {
  return createPageMetadata("signup", "/signup");
}

export default async function SignupPage() {
  const t = await getTranslations("auth.signup");

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-xl mx-auto px-6">
          <FadeUp>
            <Suspense
              fallback={
                <div className="rounded-3xl bg-[#111C2E] border border-gray-800 p-10 text-center text-gray-400">
                  {t("loading")}
                </div>
              }
            >
              <SignupForm />
            </Suspense>
          </FadeUp>
        </div>
      </main>
    </>
  );
}
