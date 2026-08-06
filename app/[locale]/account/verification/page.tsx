import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import FadeUp from "@/app/components/animations/FadeUp";
import SellerVerificationSection from "@/app/components/verification/SellerVerificationSection";
import HorseVerificationSection from "@/app/components/verification/HorseVerificationSection";
import { getSellerVerificationSnapshot } from "@/app/actions/verification";
import { getMyHorseListings } from "@/app/actions/horse-listings";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { createClient } from "@/app/lib/supabase/server";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("account", "/account/verification");
}

export default async function AccountVerificationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/account/verification"));
  }

  const [snapshotResult, listingsResult] = await Promise.all([
    getSellerVerificationSnapshot(),
    getMyHorseListings(),
  ]);

  const t = await getTranslations("verification.seller");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeUp>
            <div className="space-y-8">
              {snapshotResult.snapshot ? (
                <SellerVerificationSection initialSnapshot={snapshotResult.snapshot} />
              ) : (
                <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
                  {snapshotResult.error ?? t("title")}
                </div>
              )}
              <HorseVerificationSection listings={listingsResult.data ?? []} />
            </div>
          </FadeUp>
        </div>
      </main>
    </>
  );
}
