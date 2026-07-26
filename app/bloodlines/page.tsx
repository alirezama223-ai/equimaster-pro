import Navbar from "@/app/components/navbar/Navbar";
import BloodlinesSearchClient from "@/app/components/pedigree/BloodlinesSearchClient";
import { searchBloodlines } from "@/app/actions/pedigree";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; studbook?: string; ueln?: string }>;
};

export default async function BloodlinesPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";
  const initialStudbook = params.studbook?.trim() ?? "";
  const initialRegistrationNumber = params.ueln?.trim() ?? "";

  const { results } = await searchBloodlines({
    query: initialQuery,
    studbook: initialStudbook,
    registrationNumber: initialRegistrationNumber,
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-400">EquiMaster Pro</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-black">Bloodlines</h1>
            <p className="mt-3 text-gray-400 max-w-2xl">
              Search structured pedigree records by horse name, studbook, or registration number.
            </p>
          </div>

          <BloodlinesSearchClient
            initialResults={results}
            initialQuery={initialQuery}
            initialStudbook={initialStudbook}
            initialRegistrationNumber={initialRegistrationNumber}
          />
        </div>
      </main>
    </>
  );
}
