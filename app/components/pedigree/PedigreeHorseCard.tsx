import Link from "next/link";
import Image from "next/image";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { formatPedigreeIdentityLine, formatPedigreeSexLabel } from "@/app/lib/pedigree";
import { PedigreeSearchResult } from "@/app/types/pedigree";

type Props = {
  result: PedigreeSearchResult;
};

export default function PedigreeHorseCard({ result }: Props) {
  const hasCoverImage = Boolean(result.coverImageUrl);

  return (
    <Link
      href={`/pedigree/${result.id}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-[#111827] hover:border-blue-500/40 transition"
    >
      {hasCoverImage ? (
        <div className="relative h-44 sm:h-48 overflow-hidden">
          <Image
            src={result.coverImageUrl!}
            alt={result.name}
            fill
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {result.verified ? (
            <div className="absolute top-4 right-4 z-10">
              <VerifiedBadge />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition">
            {result.name}
          </h2>
          {result.verified && !hasCoverImage ? <VerifiedBadge /> : null}
        </div>
        <p className="mt-2 text-sm text-gray-400">
          {formatPedigreeIdentityLine({
            name: result.name,
            birthYear: result.birthYear,
            sex: result.sex,
            studbook: result.studbook,
            sireName: result.sireName,
            damSireName: result.damSireName,
          })}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          {formatPedigreeSexLabel(result.sex)}
          {result.registrationNumber ? ` · UELN/Reg: ${result.registrationNumber}` : ""}
        </p>
      </div>
    </Link>
  );
}
