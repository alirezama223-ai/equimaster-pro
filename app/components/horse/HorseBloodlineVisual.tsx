import { getTranslations } from "next-intl/server";
import HorseDetailSection from "@/app/components/horse/HorseDetailSection";
import HorseSectionEmpty from "@/app/components/horse/HorseSectionEmpty";

type LegacyPedigree = {
  sire: string;
  dam: string;
  damSire: string;
};

type Props = {
  subjectName: string;
  legacy: LegacyPedigree | null;
};

export default async function HorseBloodlineVisual({ subjectName, legacy }: Props) {
  const t = await getTranslations("pedigree");

  const hasPedigree = Boolean(
    legacy && (legacy.sire.trim() || legacy.dam.trim() || legacy.damSire.trim())
  );

  if (!hasPedigree || !legacy) {
    return (
      <HorseDetailSection id="pedigree" title={t("section.title")} subtitle={t("section.subtitle")}>
        <HorseSectionEmpty message={t("section.subtitle")} />
      </HorseDetailSection>
    );
  }

  const sire = legacy.sire.trim() || "—";
  const dam = legacy.dam.trim() || "—";
  const damSire = legacy.damSire.trim() || "—";

  return (
    <HorseDetailSection id="pedigree" title={t("section.title")} subtitle={t("section.subtitle")}>
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <BloodlineNode label={t("section.sire")} name={sire} accent="blue" />
          <BloodlineNode label={t("section.dam")} name={dam} accent="violet" />
        </div>

        <div className="my-4 flex justify-center" aria-hidden="true">
          <div className="flex flex-col items-center gap-1">
            <span className="h-6 w-px bg-gradient-to-b from-transparent via-white/25 to-blue-500/40" />
            <span className="text-xs text-blue-400/50">▼</span>
          </div>
        </div>

        <BloodlineNode label={subjectName} name={subjectName} accent="emerald" featured />

        <div className="my-4 flex justify-center" aria-hidden="true">
          <div className="h-6 w-px bg-gradient-to-b from-blue-500/30 to-white/15" />
        </div>

        <div className="mx-auto max-w-md">
          <BloodlineNode label={t("section.damSire")} name={damSire} accent="slate" />
        </div>
      </div>
    </HorseDetailSection>
  );
}

function BloodlineNode({
  label,
  name,
  accent,
  featured = false,
}: {
  label: string;
  name: string;
  accent: "blue" | "violet" | "emerald" | "slate";
  featured?: boolean;
}) {
  const accentStyles = {
    blue: "border-blue-500/30 bg-blue-600/10",
    violet: "border-violet-500/30 bg-violet-600/10",
    emerald: "border-emerald-500/35 bg-emerald-600/10",
    slate: "border-white/10 bg-white/[0.04]",
  } as const;

  return (
    <div
      className={`rounded-xl border p-4 text-center transition duration-300 sm:p-5 ${accentStyles[accent]} ${
        featured
          ? "shadow-[0_0_0_1px_rgba(16,185,129,0.15)]"
          : "[@media(hover:hover)]:hover:border-white/20 [@media(hover:hover)]:hover:bg-white/[0.06]"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p
        className={`mt-2 font-bold leading-snug text-white ${featured ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}
      >
        {name}
      </p>
    </div>
  );
}
