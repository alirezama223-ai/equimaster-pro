import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Navbar from "@/app/components/navbar/Navbar";
import SellListingForm from "@/app/components/sell/SellListingForm";
import FadeUp from "@/app/components/animations/FadeUp";
import { getListingQuotaSnapshot } from "@/app/actions/subscriptions";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { createClient } from "@/app/lib/supabase/server";
import { loginRedirectPath } from "@/app/lib/auth/paths";

export async function generateMetadata() {
  return createPageMetadata("sell", "/sell");
}

export default async function SellPage() {
  const t = await getTranslations("sell");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/sell"));
  }

  const quotaResult = await getListingQuotaSnapshot();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <div className="text-center mb-12">
              <p className="uppercase tracking-[0.2em] text-blue-500 text-sm font-semibold sm:tracking-[6px]">
                {t("page.eyebrow")}
              </p>
              <h1 className="text-3xl sm:text-5xl font-black text-white mt-4">{t("page.title")}</h1>
              <p className="mt-5 max-w-2xl mx-auto text-gray-400 text-lg">{t("page.subtitle")}</p>
            </div>
          </FadeUp>

          <FadeUp>
            <SellListingForm listingQuota={quotaResult.snapshot?.usage ?? null} />
          </FadeUp>
        </div>
      </main>
    </>
  );
}
