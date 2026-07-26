import { redirect } from "next/navigation";
import Navbar from "@/app/components/navbar/Navbar";
import AccountDashboard from "@/app/components/account/AccountDashboard";
import FadeUp from "@/app/components/animations/FadeUp";
import { getMyHorseListings } from "@/app/actions/horse-listings";
import {
  getBuyerInquiries,
  getSellerInquiries,
  getSellerNewInquiryCount,
} from "@/app/actions/inquiries";
import { getMyBreederProfile } from "@/app/actions/breeders";
import { getMyStallions } from "@/app/actions/stallions";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const [
    { data: listings },
    sellerInquiriesResult,
    buyerInquiriesResult,
    newInquiryCount,
    breederProfileResult,
    myStallionsResult,
  ] = await Promise.all([
    getMyHorseListings(),
    getSellerInquiries(),
    getBuyerInquiries(),
    getSellerNewInquiryCount(),
    getMyBreederProfile(),
    getMyStallions(),
  ]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp>
            <AccountDashboard
              user={user}
              listings={listings}
              inquiries={sellerInquiriesResult.inquiries}
              buyerInquiries={buyerInquiriesResult.inquiries}
              newInquiryCount={newInquiryCount}
              sellerInquiriesError={sellerInquiriesResult.error}
              buyerInquiriesError={buyerInquiriesResult.error}
              breederProfile={breederProfileResult.breeder ?? null}
              myStallions={myStallionsResult.stallions ?? []}
            />
          </FadeUp>
        </div>
      </main>
    </>
  );
}
