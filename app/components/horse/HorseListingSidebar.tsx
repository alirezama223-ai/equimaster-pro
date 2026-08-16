"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import StartConversationButton from "@/app/components/messaging/StartConversationButton";
import HorseQuickActions from "@/app/components/horse/HorseQuickActions";

type BuyerPrefill = { buyerName: string; buyerEmail: string };

type Props = {
  horseName: string; price: string; listingId?: string; returnPath: string; publicUrl: string;
  buyerPrefill?: BuyerPrefill; isAuthenticated: boolean; isFavorited: boolean; listingStatus: string;
  pedigreeHorseId?: string | null; contactUnavailableLabel: string; draftContactLabel: string;
  viewPedigreeLabel: string; askingPriceLabel: string;
};

export default function HorseListingSidebar({
  horseName, price, listingId, returnPath, publicUrl, buyerPrefill, isAuthenticated,
  isFavorited, listingStatus, pedigreeHorseId, contactUnavailableLabel, draftContactLabel,
  viewPedigreeLabel, askingPriceLabel,
}: Props) {
  const t = useTranslations("horse");
  const canInquire = Boolean(listingId) && listingStatus === "active";

  return (
    <aside className="hidden min-w-0 lg:block lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-2xl border border-[#D4A437]/20 bg-gradient-to-b from-[#111827] to-[#0a1220] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(212,164,55,0.04)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F7E1A1]">{t("inquiry.modalEyebrow")}</p>

        <div className="mt-4 rounded-xl border border-[#D4A437]/30 bg-[#0f1729]/90 px-4 py-3 shadow-[0_6px_24px_rgba(212,164,55,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F7E1A1]">{askingPriceLabel}</p>
          <p className="mt-1 text-3xl font-black leading-none text-white">{price}</p>
        </div>

        <div className="mt-5 space-y-4">
          <HorseQuickActions listingId={listingId} horseName={horseName} publicUrl={publicUrl} returnPath={returnPath} isFavorited={isFavorited} isAuthenticated={isAuthenticated} />

          {canInquire && listingId ? (
            <StartConversationButton
              horseListingId={listingId}
              returnPath={returnPath}
              isAuthenticated={isAuthenticated}
              fullWidth
              triggerClassName="w-full min-h-12 rounded-xl bg-[#D4A437] px-5 py-3.5 text-base font-bold text-[#081223] transition [@media(hover:hover)]:hover:bg-[#F7E1A1]"
            />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-gray-400">{listingStatus === "draft" ? draftContactLabel : contactUnavailableLabel}</div>
          )}

          {pedigreeHorseId ? (
            <Link href={`/pedigree/${pedigreeHorseId}`} className="flex w-full min-h-11 items-center justify-center rounded-xl border border-[#D4A437]/30 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-gray-200 transition [@media(hover:hover)]:hover:border-[#D4A437]/60 [@media(hover:hover)]:hover:bg-[#D4A437]/10 [@media(hover:hover)]:hover:text-[#F7E1A1]">
              {viewPedigreeLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
