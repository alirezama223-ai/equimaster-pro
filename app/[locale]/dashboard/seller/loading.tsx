import Navbar from "@/app/components/navbar/Navbar";
import { SellerDashboardPageSkeleton } from "@/app/components/seller-dashboard/SellerDashboardSkeletons";

export default function SellerDashboardLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-hidden bg-[#081223] pt-28 pb-24 text-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5 lg:px-6">
          <SellerDashboardPageSkeleton />
        </div>
      </main>
    </>
  );
}
