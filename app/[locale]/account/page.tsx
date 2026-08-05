import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import Navbar from "@/app/components/navbar/Navbar";
import AccountDashboard from "@/app/components/account/AccountDashboard";
import FadeUp from "@/app/components/animations/FadeUp";
import { getMyHorseListings, getSellerListingStats } from "@/app/actions/horse-listings";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import {
  getBuyerInquiries,
  getSellerInquiries,
  getSellerNewInquiryCount,
} from "@/app/actions/inquiries";
import { getMyBreederProfile } from "@/app/actions/breeders";
import { getMyStallions } from "@/app/actions/stallions";
import { fetchDemoEnvironmentSnapshot } from "@/app/lib/demo/queries";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("account", "/account");
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/account"));
  }

  const [
    { data: listings },
    listingStatsResult,
    sellerInquiriesResult,
    buyerInquiriesResult,
    newInquiryCount,
    breederProfileResult,
    myStallionsResult,
  ] = await Promise.all([
    getMyHorseListings(),
    getSellerListingStats(),
    getSellerInquiries(),
    getBuyerInquiries(),
    getSellerNewInquiryCount(),
    getMyBreederProfile(),
    getMyStallions(),
  ]);

  const demoSnapshotResult = await fetchDemoEnvironmentSnapshot(supabase, user.id);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <AccountDashboard
              user={user}
              listings={listings ?? []}
              listingStats={listingStatsResult.stats}
              inquiries={sellerInquiriesResult.inquiries}
              buyerInquiries={buyerInquiriesResult.inquiries}
              newInquiryCount={newInquiryCount}
              sellerInquiriesError={sellerInquiriesResult.error}
              buyerInquiriesError={buyerInquiriesResult.error}
              breederProfile={breederProfileResult.breeder ?? null}
              myStallions={myStallionsResult.stallions ?? []}
              demoSnapshot={demoSnapshotResult.snapshot}
            />
          </FadeUp>
        </div>
      </main>
    </>
  );
}
