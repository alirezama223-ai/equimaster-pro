"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { StallionCardData } from "@/app/types/stallion";
import { availabilityBadgeClass } from "@/app/lib/stallions";

type Props = {
  stallion: StallionCardData;
};

export default function StallionCard({ stallion }: Props) {
  const t = useTranslations("stallions");

  return (
    <Link href={`/stallions/${stallion.id}`}>
      <div className="group overflow-hidden rounded-3xl bg-[#111827] border border-white/10 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 cursor-pointer h-full flex flex-col">
        <div className="relative overflow-hidden">
          <Image
            src={stallion.coverImageUrl}
            alt={stallion.name}
            width={600}
            height={420}
            className="w-full h-72 object-cover group-hover:scale-110 transition duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {stallion.verified ? (
            <div className="absolute top-4 left-4">
              <VerifiedBadge />
            </div>
          ) : null}

          <div
            className={`absolute top-4 right-4 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${availabilityBadgeClass(stallion.availability)}`}
          >
            {t(`availability.${stallion.availability}`)}
          </div>

          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md rounded-xl px-4 py-2">
            <p className="text-xs text-gray-300 uppercase">{t("card.studFee")}</p>
            <p className="text-white font-bold text-xl">{stallion.studFeeLabel}</p>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <div className="mb-5">
            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition">
              {stallion.name}
            </h3>
            <p className="text-gray-400 mt-2">
              {stallion.breed}
              {stallion.studbook ? ` · ${stallion.studbook}` : ""}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stallion.breederName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <InfoCard
              icon="📅"
              label={t("card.born")}
              value={stallion.birthYear?.toString() ?? "—"}
            />
            <InfoCard icon="🎯" label={t("card.discipline")} value={stallion.discipline || "—"} />
            <InfoCard icon="🏆" label={t("card.level")} value={stallion.competitionLevel || "—"} />
            <InfoCard icon="📏" label={t("card.height")} value={stallion.height ? `${stallion.height} cm` : "—"} />
          </div>

          <div className="mt-auto flex justify-between items-center border-t border-white/10 pt-5">
            <div>
              <p className="text-xs uppercase text-gray-500">{t("card.location")}</p>
              <p className="text-white font-medium">📍 {stallion.country}</p>
            </div>

            <div className="bg-blue-600 px-5 py-3 rounded-xl text-white font-semibold group-hover:bg-blue-500 transition">
              {t("card.view")}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

type InfoProps = {
  icon: string;
  label: string;
  value: string;
};

function InfoCard({ icon, label, value }: InfoProps) {
  return (
    <div className="bg-[#1F2937] rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs uppercase tracking-wide text-gray-400">{label}</span>
      </div>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  );
}
