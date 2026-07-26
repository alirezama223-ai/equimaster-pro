import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/navbar/Navbar";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import PedigreeTree from "@/app/components/pedigree/PedigreeTree";
import TraitProfileSection from "@/app/components/traits/TraitProfileSection";
import { getPedigreeProfile } from "@/app/actions/pedigree";
import { getHorseTraitProfile } from "@/app/actions/traits";
import { formatPedigreeSexLabel } from "@/app/lib/pedigree";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PedigreeProfilePage({ params }: Props) {
  const { id } = await params;
  const [{ profile }, traitResult] = await Promise.all([
    getPedigreeProfile(id),
    getHorseTraitProfile(id),
  ]);

  if (!profile) {
    notFound();
  }

  const { horse, tree, sireName, damName, links, coverImageUrl } = profile;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div>
            <Link href="/bloodlines" className="text-gray-400 hover:text-white transition">
              ← Back to Bloodlines
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827]">
            {coverImageUrl ? (
              <div className="relative h-52 sm:h-64 md:h-80">
                <Image
                  src={coverImageUrl}
                  alt={horse.name}
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-black/20 to-transparent" />
                {horse.verified ? (
                  <div className="absolute top-4 right-4 z-10">
                    <VerifiedBadge />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl sm:text-5xl font-black">{horse.name}</h1>
                {horse.verified ? <VerifiedBadge /> : null}
              </div>
              <p className="mt-3 text-gray-400">
                {formatPedigreeSexLabel(horse.sex)}
                {horse.birthYear ? ` · ${horse.birthYear}` : ""}
                {horse.studbook ? ` · ${horse.studbook}` : ""}
                {horse.country ? ` · ${horse.country}` : ""}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Detail label="Breed" value={horse.breed ?? "—"} />
                <Detail label="Color" value={horse.color ?? "—"} />
                <Detail label="Registration / UELN" value={horse.registrationNumber ?? "—"} />
                <Detail label="Sire" value={sireName ?? "—"} />
                <Detail label="Dam" value={damName ?? "—"} />
              </div>

              {horse.description ? (
                <p className="mt-8 text-gray-300 leading-7">{horse.description}</p>
              ) : null}

              {(links.listingId || links.stallionId || horse.sex === "mare" || horse.sex === "stallion") && (
                <div className="mt-8 flex flex-wrap gap-4">
                  {horse.sex === "mare" ? (
                    <Link
                      href={`/breeding-lab?mare=${horse.id}`}
                      className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 transition"
                    >
                      Analyze Breeding →
                    </Link>
                  ) : null}
                  {horse.sex === "stallion" ? (
                    <Link
                      href={`/breeding-lab?stallion=${horse.id}`}
                      className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 transition"
                    >
                      Use in Breeding Lab →
                    </Link>
                  ) : null}
                  {links.listingId ? (
                    <Link
                      href={`/horse/${links.listingId}`}
                      className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 transition"
                    >
                      View Marketplace Listing →
                    </Link>
                  ) : null}
                  {links.stallionId ? (
                    <Link
                      href={`/stallions/${links.stallionId}`}
                      className="rounded-xl border border-white/15 px-5 py-3 font-semibold hover:border-blue-500 transition"
                    >
                      View Stallion Profile →
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {tree ? (
            <div className="rounded-3xl border border-white/10 bg-[#08111F] p-4 sm:p-6">
              <h2 className="text-3xl font-bold mb-6">Pedigree Tree</h2>
              <PedigreeTree subjectName={horse.name} tree={tree} />
            </div>
          ) : null}

          {traitResult.profile ? (
            <TraitProfileSection profile={traitResult.profile} compact />
          ) : null}

          {traitResult.canManage ? (
            <Link
              href={`/pedigree/${horse.id}/traits`}
              className="inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-200 hover:border-blue-500"
            >
              Manage Trait Evidence →
            </Link>
          ) : null}
        </div>
      </main>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 font-semibold text-white break-words">{value}</p>
    </div>
  );
}
