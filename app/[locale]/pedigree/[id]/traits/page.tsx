import { Link } from "@/i18n/navigation";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/app/components/navbar/Navbar";
import TraitManagementPanel from "@/app/components/traits/TraitManagementPanel";
import { getPedigreeProfile } from "@/app/actions/pedigree";
import {
  getHorseTraitProfile,
  getManagerTraitSubmissionContext,
  getTraitEvidenceHistory,
} from "@/app/actions/traits";
import { buildHorseTraitProfile } from "@/app/lib/traits/aggregate";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PedigreeTraitsManagementPage({ params }: Props) {
  const { id } = await params;
  const [{ profile }, traitResult, historyResult, managerContext] = await Promise.all([
    getPedigreeProfile(id),
    getHorseTraitProfile(id),
    getTraitEvidenceHistory(id),
    getManagerTraitSubmissionContext(id),
  ]);

  if (!profile) {
    notFound();
  }

  if (!managerContext.canManage || historyResult.error) {
    redirect(`/pedigree/${id}`);
  }

  const horseProfile = traitResult.profile ?? buildHorseTraitProfile(id, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <div>
            <Link href={`/pedigree/${id}`} className="text-gray-400 hover:text-white transition">
              ← Back to {profile.horse.name}
            </Link>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-blue-400">Trait Evidence Management</p>
            <h1 className="mt-2 text-4xl font-black">{profile.horse.name}</h1>
            <p className="mt-3 text-gray-400">
              Submit owner/breeder reported evidence, review history, and inspect aggregated trait profiles.
              Evidence provenance is preserved and never auto-verified.
            </p>
          </div>

          <TraitManagementPanel
            pedigreeHorseId={id}
            horseName={profile.horse.name}
            profile={horseProfile}
            historyRows={historyResult.rows}
            sourceLabel={managerContext.sourceLabel}
          />
        </div>
      </main>
    </>
  );
}
