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
  hideLegacy?: boolean;
};

export default async function PedigreeSection({ subjectName, tree, legacy, hideLegacy = false }: Props) {
  const t = await getTranslations("pedigree");

  if (!tree && (!legacy || hideLegacy)) {
    return null;
  }

  return (
    <section>
      {!hideLegacy && legacy ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">{t("section.title")}</h2>
              <p className="mt-2 text-gray-400 text-sm max-w-2xl">
                {t("section.subtitle")}
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <LegacyCard label={t("section.sire")} value={legacy.sire} />
            <LegacyCard label={t("section.dam")} value={legacy.dam} />
            <LegacyCard label={t("section.damSire")} value={legacy.damSire || "—"} />
          </div>
        </>
      ) : null}

      {tree ? (
        <>
          {hideLegacy ? (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("tree.subject")}</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">{t("section.subtitle")}</p>
            </div>
          ) : null}
          <div className="rounded-2xl border border-white/[0.08] bg-[#08111F] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:p-6">
            <PedigreeTree subjectName={subjectName} tree={tree} />
          </div>
        </>
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
