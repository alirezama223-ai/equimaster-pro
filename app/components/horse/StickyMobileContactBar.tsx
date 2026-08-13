"use client";

import StartConversationButton from "@/app/components/messaging/StartConversationButton";
import HorseQuickActions from "@/app/components/horse/HorseQuickActions";
import { SAFE_AREA_BOTTOM_PADDING_STYLE } from "@/app/lib/browser-compat";

type BuyerPrefill = { buyerName: string; buyerEmail: string };
type Props = { horseName: string; price: string; listingId: string; returnPath: string; publicUrl: string; buyerPrefill?: BuyerPrefill; isAuthenticated: boolean; isFavorited: boolean; contactLabel: string };

export default function StickyMobileContactBar({ horseName, price, listingId, returnPath, publicUrl, isAuthenticated, isFavorited }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4A437]/20 bg-[#0a1220]/95 backdrop-blur-xl lg:hidden" style={SAFE_AREA_BOTTOM_PADDING_STYLE}>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{horseName}</p><p className="truncate text-base font-bold text-[#F7E1A1]">{price}</p></div>
        <HorseQuickActions listingId={listingId} horseName={horseName} publicUrl={publicUrl} returnPath={returnPath} isFavorited={isFavorited} isAuthenticated={isAuthenticated} layout="row" />
      </div>
      <div className="border-t border-white/[0.06] px-4 pb-3 pt-2">
        <StartConversationButton horseListingId={listingId} returnPath={returnPath} isAuthenticated={isAuthenticated} fullWidth triggerClassName="w-full min-h-12 rounded-xl bg-[#D4A437] px-4 text-base font-bold text-[#081223] transition [@media(hover:hover)]:hover:bg-[#F7E1A1] active:bg-[#F7E1A1]" />
      </div>
    </div>
  );
}
