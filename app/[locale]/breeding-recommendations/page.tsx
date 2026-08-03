import Navbar from "@/app/components/navbar/Navbar";
import StallionMatchClient from "@/app/components/breeding-recommendations/StallionMatchClient";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("breedingRecommendations", "/breeding-recommendations");
}

export default function BreedingRecommendationsPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <StallionMatchClient />
        </div>
      </main>
    </>
  );
}
