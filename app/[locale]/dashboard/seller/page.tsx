import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import Navbar from "@/app/components/navbar/Navbar";
import SellerDashboardClient from "@/app/components/marketplace/SellerDashboardClient";
import { getSellerDashboardData } from "@/app/actions/marketplace-dashboard";
import { MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { createClient } from "@/app/lib/supabase/server";
import { getProfileForUser } from "@/app/lib/profiles";

export async function generateMetadata() {
  return createPageMetadata("sellerDashboard", MARKETPLACE_PATHS.sellerDashboard);
}

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const t = await getTranslations("dashboard");
  const tAccount = await getTranslations("account.dashboard");
  const [result, supabase] = await Promise.all([
    getSellerDashboardData(),
    createClient(),
  ]);

  if (result.unauthenticated) {
    redirect(loginRedirectPath(MARKETPLACE_PATHS.sellerDashboard));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sellerName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    result.dashboard?.listings[0]?.seller_name?.trim() ||
    tAccount("defaultName");

  const profile = user ? await getProfileForUser(supabase, user.id) : null;

  if (!result.dashboard) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen overflow-x-hidden bg-[#081223] pt-28 pb-24 px-4 sm:px-5">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-red-300">{result.error ?? t("header.loadError")}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-hidden bg-[#081223] pt-28 pb-[calc(5rem+env(safe-area-inset-bottom))] text-white lg:pb-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5 lg:px-6">
          <SellerDashboardClient
            dashboard={result.dashboard}
            sellerName={sellerName}
            sellerVerified={Boolean(profile?.seller_verified)}
          />
        </div>
      </main>
    </>
  );
}
