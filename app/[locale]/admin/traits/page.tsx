import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
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
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={tTraits("title")}
        description={tTraits("subtitle")}
      />
      <AdminTraitsClient
        filter={filter}
        sourceType={sourceType}
        pedigreeHorseId={pedigreeHorseId}
        assessments={assessments}
        stats={stats}
      />
    </div>
  );
}
