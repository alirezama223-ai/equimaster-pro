"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import ContactInquiryModal from "@/app/components/horse/ContactInquiryModal";
import MarketplaceCardFavoriteButton from "@/app/components/marketplace/MarketplaceCardFavoriteButton";
import MarketplaceCardShareButton from "@/app/components/marketplace/MarketplaceCardShareButton";
import MarketplaceCompareButton from "@/app/components/marketplace/MarketplaceCompareButton";

type BuyerPrefill = {
  buyerName: string;
  buyerEmail: string;
};

type Props = {
  horseName: string;
  listingId?: string;
  returnPath: string;
  publicUrl: string;
  buyerPrefill?: BuyerPrefill;
  isAuthenticated: boolean;
  isFavorited: boolean;
  listingStatus: string;
  pedigreeHorseId?: string | null;
  contactUnavailableLabel: string;
  draftContactLabel: string;
  viewPedigreeLabel: string;
};

export default function HorseListingSidebar({
  horseName,
  listingId,
  returnPath,
  publicUrl,
  buyerPrefill,
  isAuthenticated,
  isFavorited,
  listingStatus,
  pedigreeHorseId,
  contactUnavailableLabel,
  draftContactLabel,
  viewPedigreeLabel,
}: Props) {
  const t = useTranslations("horse");
  const canInquire = Boolean(listingId) && listingStatus === "active";

  return (
    <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111827] to-[#0a1220] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          {t("inquiry.modalEyebrow")}
        </p>

        <div className="mt-4 space-y-3">
          {canInquire && listingId ? (
            <ContactInquiryModal
              horseName={horseName}
              listingId={listingId}
              returnPath={returnPath}
              buyerPrefill={buyerPrefill}
              isAuthenticated={isAuthenticated}
              fullWidth
              triggerClassName="w-full min-h-12 rounded-xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white transition [@media(hover:hover)]:hover:bg-blue-500"
            />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-gray-400">
              {listingStatus === "draft" ? draftContactLabel : contactUnavailableLabel}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <MarketplaceCardShareButton url={publicUrl} title={horseName} />
            <MarketplaceCompareButton
              listingId={listingId ?? ""}
              name={horseName}
              disabled={!listingId}
            />
            <MarketplaceCardFavoriteButton
              listingId={listingId ?? ""}
              initialFavorited={isFavorited}
              returnPath={returnPath}
              disabled={!listingId}
            />
          </div>

          {pedigreeHorseId ? (
            <Link
              href={`/pedigree/${pedigreeHorseId}`}
              className="flex w-full min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-gray-200 transition [@media(hover:hover)]:hover:border-white/25 [@media(hover:hover)]:hover:bg-white/[0.06]"
            >
              {viewPedigreeLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
