import { Horse } from "../../data/horses";

type Props = {
  horse: Horse;
};

export default function HorsePedigree({ horse }: Props) {
  return (
    <section className="mt-16">
      <h2 className="text-3xl font-bold mb-8">Pedigree</h2>

      <div className="grid md:grid-cols-3 gap-6">

        <div className="bg-[#111827] rounded-2xl p-6">
          <p className="text-gray-400 text-sm">Sire</p>
          <p className="text-2xl font-bold mt-2">
            {horse.sire}
          </p>
        </div>

        <div className="bg-[#111827] rounded-2xl p-6">
          <p className="text-gray-400 text-sm">Dam</p>
          <p className="text-2xl font-bold mt-2">
            {horse.dam}
          </p>
        </div>

        <div className="bg-[#111827] rounded-2xl p-6">
          <p className="text-gray-400 text-sm">Dam&apos;s Sire</p>
          <p className="text-2xl font-bold mt-2">
            {horse.damSire || "—"}
          </p>
        </div>

      </div>
    </section>
  );
}