"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import ListingPreview from "@/app/components/sell/ListingPreview";
import HorseListingPaymentPanel from "@/app/components/marketplace/HorseListingPaymentPanel";
import { getListingEditPath, getPublicListingPath } from "@/app/lib/marketplace/paths";
import { listingImagesFromRow, listingRowToFormData } from "@/app/lib/horse-listings";
import type { HorseListingRow } from "@/app/types/horse-listing";

type Plan = {
  id: string;
  slug: string;
  name: string;
  visibility_level: string;
  duration_days: number;
  price: number;
  currency: string;
  sort_order: number;
  features: string[];
};

type Props = {
  listing: HorseListingRow;
  plans: Plan[];
  paidOrder: {
    plan_slug: string;
    plan_name: string;
    expires_at: string | null;
  } | null;
  paymentStatus: "success" | "cancelled" | null;
};

export default function HorseListingPreviewActions({
  listing,
  plans,
  paidOrder,
  paymentStatus,
}: Props) {
  const t = useTranslations("dashboard");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const formData = listingRowToFormData(listing);
  const images = listingImagesFromRow(listing);

  const isPaid = Boolean(paidOrder);
  const isActive = listing.status === "active";

  function handleRefresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-8">
      <ListingPreview
        data={formData}
        images={images}
        videoFile={null}
        videoPreviewUrl={null}
        existingVideoUrl={listing.video_url}
      />

      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Link
          href={getListingEditPath(listing.id)}
          className="rounded-xl border border-white/20 px-8 py-4 text-center font-semibold text-white transition hover:bg-white/10"
        >
          {t("preview.backToEdit")}
        </Link>
        {isActive ? (
          <Link
            href={getPublicListingPath(listing.slug)}
            className="rounded-xl bg-blue-600 px-8 py-4 text-center font-semibold text-white transition hover:bg-blue-500"
          >
            {t("preview.viewPublic")}
          </Link>
        ) : null}
      </div>

      {!isActive ? (
        <HorseListingPaymentPanel
          listingId={listing.id}
          plans={plans}
          paidOrder={paidOrder}
          paymentStatus={paymentStatus}
        />
      ) : null}

      {isPaid && !isActive ? (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isPending}
          className="mx-auto block text-sm font-semibold text-blue-300 underline underline-offset-4 disabled:opacity-60"
        >
          {isPending ? "Refreshing..." : "Refresh moderation status"}
        </button>
      ) : null}
    </div>
  );
}
