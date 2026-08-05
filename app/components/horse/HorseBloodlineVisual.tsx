import { getTranslations } from "next-intl/server";

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

  if (!legacy || (!legacy.sire.trim() && !legacy.dam.trim())) {
    return null;
  }

  const sire = legacy.sire.trim() || "—";
  const dam = legacy.dam.trim() || "—";
  const damSire = legacy.damSire.trim() || "—";

  return (
    <section aria-labelledby="bloodline-heading" className="overflow-hidden">
      <div className="mb-6">
        <h2 id="bloodline-heading" className="text-2xl font-bold text-white sm:text-3xl">
          {t("section.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
          {t("section.subtitle")}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111827] to-[#0a1220] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.3)] sm:p-8">
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
    </section>
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
      className={`rounded-2xl border p-4 text-center transition duration-300 sm:p-5 ${accentStyles[accent]} ${
        featured
          ? "shadow-[0_0_0_1px_rgba(16,185,129,0.15),0_8px_32px_rgba(0,0,0,0.25)]"
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
