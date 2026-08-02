import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import AdminTraitsClient from "@/app/components/admin/AdminTraitsClient";
import { getAdminTraitAssessments, getAdminTraitStats } from "@/app/actions/traits";
import { TraitSourceType } from "@/app/types/traits";

export const dynamic = "force-dynamic";

const SOURCE_TYPES: TraitSourceType[] = [
  "owner_reported",
  "breeder_reported",
  "admin_assessed",
  "verified_record",
  "performance_data",
  "offspring_data",
];

type Props = {
  searchParams: Promise<{
    filter?: "pending" | "verified" | "all";
    sourceType?: string;
    horse?: string;
  }>;
};

export default async function AdminTraitsPage({ searchParams }: Props) {
  const t = await getTranslations("admin");
  const tTraits = await getTranslations("admin.traits");
  const params = await searchParams;
  const filter = params.filter ?? "pending";
  const sourceType = SOURCE_TYPES.includes(params.sourceType as TraitSourceType)
    ? (params.sourceType as TraitSourceType)
    : undefined;
  const pedigreeHorseId = params.horse?.trim() || undefined;

  const [{ assessments }, stats] = await Promise.all([
    getAdminTraitAssessments({ filter, sourceType, pedigreeHorseId }),
    getAdminTraitStats(),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("adminEyebrow")}</p>
            <h1 className="mt-2 text-4xl font-black text-white">{tTraits("title")}</h1>
            <p className="mt-3 text-gray-400">{tTraits("subtitle")}</p>
          </div>
          <AdminTraitsClient
            filter={filter}
            sourceType={sourceType}
            pedigreeHorseId={pedigreeHorseId}
            assessments={assessments}
            stats={stats}
          />
        </div>
      </main>
    </>
  );
}
