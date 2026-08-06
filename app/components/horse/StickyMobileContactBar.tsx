"use client";

import StartConversationButton from "@/app/components/messaging/StartConversationButton";
import HorseQuickActions from "@/app/components/horse/HorseQuickActions";
import { SAFE_AREA_BOTTOM_PADDING_STYLE } from "@/app/lib/browser-compat";

type BuyerPrefill = {
  buyerName: string;
  buyerEmail: string;
};

type Props = {
  horseName: string;
  price: string;
  listingId: string;
  returnPath: string;
  publicUrl: string;
  buyerPrefill?: BuyerPrefill;
  isAuthenticated: boolean;
  isFavorited: boolean;
  contactLabel: string;
};

export default function StickyMobileContactBar({
  horseName,
  price,
  listingId,
  returnPath,
  publicUrl,
  buyerPrefill,
  isAuthenticated,
  isFavorited,
  contactLabel,
}: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a1220]/95 backdrop-blur-xl lg:hidden"
      style={SAFE_AREA_BOTTOM_PADDING_STYLE}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{horseName}</p>
          <p className="truncate text-base font-bold text-blue-300">{price}</p>
        </div>
        <HorseQuickActions
          listingId={listingId}
          horseName={horseName}
          publicUrl={publicUrl}
          returnPath={returnPath}
          isFavorited={isFavorited}
          isAuthenticated={isAuthenticated}
          layout="row"
        />
      </div>
      <div className="border-t border-white/[0.06] px-4 pb-3 pt-2">
        <StartConversationButton
          horseListingId={listingId}
          returnPath={returnPath}
          isAuthenticated={isAuthenticated}
          fullWidth
          triggerClassName="w-full min-h-12 rounded-xl bg-blue-600 px-4 text-base font-semibold text-white transition active:bg-blue-500"
        />
      </div>
    </div>
  );
}
