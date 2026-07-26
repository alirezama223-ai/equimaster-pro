type Props = {
  sire: string;
  dam: string;
  damSire: string;
};

export default function StallionPedigree({ sire, dam, damSire }: Props) {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">Pedigree</h2>

      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <PedigreeNode label="Sire" name={sire} accent="from-blue-600/20 to-transparent" />
          <PedigreeNode label="Dam" name={dam} accent="from-purple-600/20 to-transparent" />
          <PedigreeNode label="Dam's Sire" name={damSire || "—"} accent="from-emerald-600/20 to-transparent" />
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Extended pedigree charts will be available in a future release.
        </p>
      </div>
    </section>
  );
}

type NodeProps = {
  label: string;
  name: string;
  accent: string;
};

function PedigreeNode({ label, name, accent }: NodeProps) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-b ${accent} p-6`}>
      <p className="text-xs uppercase tracking-[3px] text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-3 leading-tight">{name}</p>
    </div>
  );
}
