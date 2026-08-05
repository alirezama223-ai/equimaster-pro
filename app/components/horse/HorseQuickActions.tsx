"use client";

import { memo } from "react";
import MarketplaceCardFavoriteButton from "@/app/components/marketplace/MarketplaceCardFavoriteButton";
import MarketplaceCardShareButton from "@/app/components/marketplace/MarketplaceCardShareButton";
import MarketplaceCompareButton from "@/app/components/marketplace/MarketplaceCompareButton";
import ReportListingButton from "@/app/components/horse/ReportListingButton";

const actionButtonClass =
  "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] text-gray-200 shadow-sm transition duration-200 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-white/25 [@media(hover:hover)]:hover:bg-white/[0.06] [@media(hover:hover)]:hover:shadow-md disabled:opacity-45";

type Props = {
  listingId?: string;
  horseName: string;
  publicUrl: string;
  returnPath: string;
  isFavorited: boolean;
  isAuthenticated: boolean;
  layout?: "row" | "grid";
};

function HorseQuickActions({
  listingId,
  horseName,
  publicUrl,
  returnPath,
  isFavorited,
  isAuthenticated,
  layout = "grid",
}: Props) {
  const containerClass =
    layout === "row"
      ? "flex items-center gap-2"
      : "grid grid-cols-4 gap-2";

  return (
    <div className={containerClass}>
      <MarketplaceCardFavoriteButton
        listingId={listingId ?? ""}
        initialFavorited={isFavorited}
        returnPath={returnPath}
        disabled={!listingId}
        className={`${actionButtonClass} !h-12 !w-12 !min-w-0 !p-0`}
      />
      <MarketplaceCompareButton
        listingId={listingId ?? ""}
        name={horseName}
        disabled={!listingId}
        className={`${actionButtonClass} !h-12 !w-12 !min-w-0 !p-0`}
      />
      <MarketplaceCardShareButton
        url={publicUrl}
        title={horseName}
        className={`${actionButtonClass} !h-12 !w-12 !min-w-0 !p-0`}
      />
      <ReportListingButton
        isAuthenticated={isAuthenticated}
        returnPath={returnPath}
        listingName={horseName}
        className={actionButtonClass}
      />
    </div>
  );
}

export default memo(HorseQuickActions);
