import { getTranslations } from "next-intl/server";
import PedigreeTree from "@/app/components/pedigree/PedigreeTree";
import { PedigreeTreeNode } from "@/app/types/pedigree";

type Props = {
  subjectName: string;
  tree: PedigreeTreeNode | null;
  legacy?: {
    sire: string;
    dam: string;
    damSire: string;
  } | null;
};

export default async function PedigreeSection({ subjectName, tree, legacy }: Props) {
  const t = await getTranslations("pedigree");

  return (
    <section>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">{t("section.title")}</h2>
          <p className="mt-2 text-gray-400 text-sm max-w-2xl">
            {t("section.subtitle")}
          </p>
        </div>
      </div>

      {legacy ? (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <LegacyCard label={t("section.sire")} value={legacy.sire} />
          <LegacyCard label={t("section.dam")} value={legacy.dam} />
          <LegacyCard label={t("section.damSire")} value={legacy.damSire || "—"} />
        </div>
      ) : null}

      {tree ? (
        <div className="rounded-3xl border border-white/10 bg-[#08111F] p-4 sm:p-6">
          <PedigreeTree subjectName={subjectName} tree={tree} />
        </div>
      ) : null}
    </section>
  );
}

function LegacyCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-white leading-snug">{value}</p>
    </div>
  );
}
