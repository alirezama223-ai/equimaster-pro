"use client";

import ContactInquiryModal from "@/app/components/horse/ContactInquiryModal";
import FavoriteButton from "@/app/components/favorites/FavoriteButton";

type BuyerPrefill = {
  buyerName: string;
  buyerEmail: string;
};

type Props = {
  horseName: string;
  listingId: string;
  returnPath: string;
  buyerPrefill?: BuyerPrefill;
  isAuthenticated: boolean;
  isFavorited: boolean;
};

export default function StickyMobileContactBar({
  horseName,
  listingId,
  returnPath,
  buyerPrefill,
  isAuthenticated,
  isFavorited,
}: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#111827]/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-stretch gap-3 px-4 pt-3">
        <div className="min-w-0 flex-1">
          <ContactInquiryModal
            horseName={horseName}
            listingId={listingId}
            returnPath={returnPath}
            buyerPrefill={buyerPrefill}
            isAuthenticated={isAuthenticated}
            fullWidth
            triggerClassName="py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition"
          />
        </div>
        <FavoriteButton
          listingId={listingId}
          initialFavorited={isFavorited}
          returnPath={returnPath}
          variant="button"
          className="!w-auto shrink-0 px-5 py-3.5 min-w-[5.75rem] rounded-xl"
        />
      </div>
    </div>
  );
}
