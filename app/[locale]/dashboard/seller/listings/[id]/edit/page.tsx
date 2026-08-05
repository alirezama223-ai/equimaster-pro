import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import Navbar from "@/app/components/navbar/Navbar";
import SellListingForm from "@/app/components/sell/SellListingForm";
import FadeUp from "@/app/components/animations/FadeUp";
import { getHorseListingForOwner } from "@/app/actions/horse-listings";
import { isListingUuid } from "@/app/lib/horse-listings";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditSellerListingPage({ params }: Props) {
  const t = await getTranslations("dashboard");
  const { id } = await params;

  if (!isListingUuid(id)) {
    notFound();
  }

  const result = await getHorseListingForOwner(id);

  if (result.unauthenticated) {
    redirect(loginRedirectPath(`/dashboard/seller/listings/${id}/edit`));
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
            <div className="text-center mb-12">
              <p className="uppercase tracking-[6px] text-blue-500 text-sm font-semibold">
                {t("edit.eyebrow")}
              </p>
              <h1 className="text-4xl sm:text-5xl font-black text-white mt-4">
                {t("edit.title")}
              </h1>
              <p className="mt-5 max-w-2xl mx-auto text-gray-400 text-lg">
                {t("edit.subtitle")}
              </p>
            </div>
            <SellListingForm mode="edit" initialListing={result.data} />
          </FadeUp>
        </div>
      </main>
    </>
  );
}
