import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import Navbar from "@/app/components/navbar/Navbar";
import SellListingForm from "@/app/components/sell/SellListingForm";
import FadeUp from "@/app/components/animations/FadeUp";
import { getHorseListingForOwner } from "@/app/actions/horse-listings";
import { isListingUuid } from "@/app/lib/horse-listings";
import { getTraitEvidencePath } from "@/app/lib/marketplace/paths";
import { Link } from "@/i18n/navigation";

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

  const pedigreeHorseId = result.data.pedigree_horse_id;

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

              {pedigreeHorseId ? (
                <div className="mt-7 flex justify-center">
                  <Link
                    href={getTraitEvidencePath(pedigreeHorseId)}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 hover:text-white"
                  >
                    🧬 Manage Trait Evidence
                  </Link>
                </div>
              ) : null}
            </div>
            <SellListingForm mode="edit" initialListing={result.data} />
          </FadeUp>
        </div>
      </main>
    </>
  );
}
