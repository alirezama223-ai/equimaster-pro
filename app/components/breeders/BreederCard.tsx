import Link from "next/link";
import Image from "next/image";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { BreederCardData } from "@/app/types/breeder";

type Props = {
  breeder: BreederCardData;
};

export default function BreederCard({ breeder }: Props) {
  return (
    <Link href={`/breeders/${breeder.id}`}>
      <div className="group overflow-hidden rounded-3xl bg-[#111827] border border-white/10 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 cursor-pointer h-full flex flex-col">
        <div className="relative h-44 overflow-hidden">
          <Image
            src={breeder.coverImageUrl}
            alt={`${breeder.name} cover`}
            fill
            className="object-cover group-hover:scale-105 transition duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute -bottom-8 left-6">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#111827] bg-[#111827]">
              <Image
                src={breeder.logoUrl}
                alt={`${breeder.name} logo`}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {breeder.verified ? (
            <div className="absolute top-4 right-4">
              <VerifiedBadge />
            </div>
          ) : null}
        </div>

        <div className="p-6 pt-12 flex-1 flex flex-col">
          <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition">
            {breeder.name}
          </h3>

          <p className="text-gray-400 mt-2">
            📍 {breeder.city ? `${breeder.city}, ` : ""}
            {breeder.country}
          </p>

          {breeder.description ? (
            <p className="text-gray-400 mt-4 line-clamp-3 leading-7">{breeder.description}</p>
          ) : null}

          {breeder.disciplines.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {breeder.disciplines.slice(0, 3).map((discipline) => (
                <span
                  key={discipline}
                  className="rounded-full border border-white/10 bg-[#1F2937] px-3 py-1 text-xs text-gray-300"
                >
                  {discipline}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto pt-6 flex justify-between items-center border-t border-white/10">
            <div>
              <p className="text-xs uppercase text-gray-500">Stallions</p>
              <p className="text-white font-semibold">{breeder.stallionCount}</p>
            </div>
            <div className="bg-blue-600 px-5 py-3 rounded-xl text-white font-semibold group-hover:bg-blue-500 transition">
              View →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
