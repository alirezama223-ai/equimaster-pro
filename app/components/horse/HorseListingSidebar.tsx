"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import StartConversationButton from "@/app/components/messaging/StartConversationButton";
import HorseQuickActions from "@/app/components/horse/HorseQuickActions";

type BuyerPrefill = {
  buyerName: string;
  buyerEmail: string;
};

type Props = {
  horseName: string;
  price: string;
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
  askingPriceLabel: string;
};

export default function HorseListingSidebar({
  horseName,
  price,
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
  askingPriceLabel,
}: Props) {
  const t = useTranslations("horse");
  const canInquire = Boolean(listingId) && listingStatus === "active";

  return (
    <aside className="hidden min-w-0 lg:block lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111827] to-[#0a1220] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          {t("inquiry.modalEyebrow")}
        </p>

        <div className="mt-4 rounded-xl border border-blue-500/20 bg-[#0f1729]/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300/90">
            {askingPriceLabel}
          </p>
          <p className="mt-1 text-3xl font-black leading-none text-white">{price}</p>
        </div>

        <div className="mt-5 space-y-4">
          <HorseQuickActions
            listingId={listingId}
            horseName={horseName}
            publicUrl={publicUrl}
            returnPath={returnPath}
            isFavorited={isFavorited}
            isAuthenticated={isAuthenticated}
          />

          {canInquire && listingId ? (
            <StartConversationButton
              horseListingId={listingId}
              returnPath={returnPath}
              isAuthenticated={isAuthenticated}
              fullWidth
              triggerClassName="w-full min-h-12 rounded-xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white transition [@media(hover:hover)]:hover:bg-blue-500"
            />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-gray-400">
              {listingStatus === "draft" ? draftContactLabel : contactUnavailableLabel}
            </div>
          )}

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
