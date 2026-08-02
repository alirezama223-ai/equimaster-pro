import type { User } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LogoutButton from "@/app/components/auth/LogoutButton";
import SellerListingsDashboard from "@/app/components/account/SellerListingsDashboard";
import MyBreederSection from "@/app/components/account/MyBreederSection";
import MyStallionsSection from "@/app/components/account/MyStallionsSection";
import InquiriesSection from "@/app/components/account/InquiriesSection";
import BuyerInquiriesSection from "@/app/components/account/BuyerInquiriesSection";
import DemoEnvironmentPanel from "@/app/components/account/DemoEnvironmentPanel";
import { HorseListingRow } from "@/app/types/horse-listing";
import { BuyerInquiry, SellerInquiry } from "@/app/types/inquiry";
import { BreederRow } from "@/app/types/breeder";
import { StallionRow } from "@/app/types/stallion";
import type { DemoEnvironmentSnapshot } from "@/app/types/demo";
import type { SellerListingStats } from "@/app/types/marketplace";

type Props = {
  user: User;
  listings: HorseListingRow[];
  listingStats: SellerListingStats;
  inquiries: SellerInquiry[];
  buyerInquiries: BuyerInquiry[];
  newInquiryCount: number;
  sellerInquiriesError?: string;
  buyerInquiriesError?: string;
  breederProfile: BreederRow | null;
  myStallions: StallionRow[];
  demoSnapshot: DemoEnvironmentSnapshot;
};

export default async function AccountDashboard({
  user,
  listings,
  listingStats,
  inquiries,
  buyerInquiries,
  newInquiryCount,
  sellerInquiriesError,
  buyerInquiriesError,
  breederProfile,
  myStallions,
  demoSnapshot,
}: Props) {
  const t = await getTranslations("account.dashboard");
  const fullName =
    (user.user_metadata?.full_name as string | undefined) || t("defaultName");

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[#111C2E] border border-gray-800 p-6 sm:p-8">
        <p className="uppercase tracking-[6px] text-blue-500 text-xs font-semibold">
          {t("eyebrow")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-4">
          {t("welcome", { name: fullName })}
        </h1>
        <p className="mt-3 text-gray-400">{user.email}</p>

        {newInquiryCount > 0 ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600/20 border border-blue-500/30 px-4 py-2 text-sm text-blue-200">
            {newInquiryCount === 1
              ? t("newInquiry", { count: newInquiryCount })
              : t("newInquiries", { count: newInquiryCount })}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/sell"
            className="inline-flex justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-4 text-white font-semibold transition"
          >
            {t("createListing")}
          </Link>
          <LogoutButton />
        </div>
      </section>

      <DemoEnvironmentPanel snapshot={demoSnapshot} />

      <SellerListingsDashboard listings={listings} stats={listingStats} />

      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <Link
          href="/dashboard/seller"
          className="text-blue-300 hover:text-blue-200 font-semibold"
        >
          {t("openSellerDashboard")}
        </Link>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <MyBreederSection breeder={breederProfile} ownerId={user.id} />
      </section>

      <MyStallionsSection
        stallions={myStallions}
        breederId={breederProfile?.id ?? null}
        ownerId={user.id}
      />

      <InquiriesSection
        initialInquiries={inquiries}
        currentUserId={user.id}
        sellerName={fullName}
        loadError={sellerInquiriesError}
      />

      <BuyerInquiriesSection
        initialInquiries={buyerInquiries}
        currentUserId={user.id}
        loadError={buyerInquiriesError}
      />
    </div>
  );
}
