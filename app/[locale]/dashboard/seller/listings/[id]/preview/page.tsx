import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import Navbar from "@/app/components/navbar/Navbar";
import FadeUp from "@/app/components/animations/FadeUp";
import { ListingPreviewActions } from "@/app/components/marketplace/SellerDashboardClient";
import { getHorseListingForOwner } from "@/app/actions/horse-listings";
import { isListingUuid } from "@/app/lib/horse-listings";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ListingPreviewPage({ params }: Props) {
  const t = await getTranslations("dashboard");
  const { id } = await params;

  if (!isListingUuid(id)) {
    notFound();
  }

  const result = await getHorseListingForOwner(id);

  if (result.unauthenticated) {
    redirect(loginRedirectPath(`/dashboard/seller/listings/${id}/preview`));
  }

  if (!result.data) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <div className="text-center mb-10">
              <p className="uppercase tracking-[6px] text-blue-500 text-xs font-semibold">
                {t("preview.eyebrow")}
              </p>
              <h1 className="text-4xl font-black text-white mt-3">{result.data.name}</h1>
              <p className="mt-3 text-gray-400">{t("preview.subtitle")}</p>
            </div>
            <ListingPreviewActions listing={result.data} />
          </FadeUp>
        </div>
      </main>
    </>
  );
}
