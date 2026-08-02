import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import Navbar from "@/app/components/navbar/Navbar";
import FadeUp from "@/app/components/animations/FadeUp";
import SellerDashboardClient from "@/app/components/marketplace/SellerDashboardClient";
import { getSellerDashboardData } from "@/app/actions/marketplace-dashboard";
import { MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const t = await getTranslations("marketplace");
  const result = await getSellerDashboardData();

  if (result.unauthenticated) {
    redirect(loginRedirectPath(MARKETPLACE_PATHS.sellerDashboard));
  }

  if (!result.dashboard) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#08111F] pt-28 pb-24 px-6">
          <p className="text-red-300">{result.error ?? t("sellerDashboard.loadError")}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="uppercase tracking-[6px] text-blue-500 text-xs font-semibold">
                  {t("sellerDashboard.eyebrow")}
                </p>
                <h1 className="text-4xl font-black text-white mt-3">{t("sellerDashboard.title")}</h1>
                <p className="mt-3 text-gray-400">{t("sellerDashboard.subtitle")}</p>
              </div>
              <Link
                href={MARKETPLACE_PATHS.createListing}
                className="inline-flex justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition"
              >
                {t("sellerDashboard.createListing")}
              </Link>
            </div>
          </FadeUp>

          <FadeUp>
            <SellerDashboardClient dashboard={result.dashboard} />
          </FadeUp>
        </div>
      </main>
    </>
  );
}
