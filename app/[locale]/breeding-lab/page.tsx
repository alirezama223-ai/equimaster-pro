import Navbar from "@/app/components/navbar/Navbar";
import BreedingLabClient from "@/app/components/breeding/BreedingLabClient";
import { getSavedBreedingAnalyses, resolveBreedingLabPrefill } from "@/app/actions/breeding";
import { createClient } from "@/app/lib/supabase/server";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("breedingLab", "/breeding-lab");
}

type Props = {
  searchParams: Promise<{ mare?: string; stallion?: string; compare?: string; stallionDirectory?: string }>;
};

export default async function BreedingLabPage({ searchParams }: Props) {
  const params = await searchParams;
  const prefill = await resolveBreedingLabPrefill({
    mare: params.mare,
    stallion: params.stallion,
    stallionDirectory: params.stallionDirectory,
  });

  const compareIds = params.compare
    ? params.compare.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 2)
    : [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const saved = await getSavedBreedingAnalyses();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <BreedingLabClient
            initialMareId={prefill.mareId}
            initialStallionId={prefill.stallionId}
            initialCompareStallionIds={compareIds}
            savedAnalyses={saved.analyses}
            isAuthenticated={Boolean(user)}
          />
        </div>
      </main>
    </>
  );
}
