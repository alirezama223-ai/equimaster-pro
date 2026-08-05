"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Horse } from "../../data/horses";
import { getHorseDetailPath } from "../../lib/horse-listings";
import FavoriteButton from "@/app/components/favorites/FavoriteButton";

type Props = {
  horse: Horse;
  isFavorited?: boolean;
  onFavoriteChange?: (favorited: boolean) => void;
  /** Translation namespace for card labels — use "home" on the homepage. */
  labelsScope?: "home" | "marketplace";
};

export default function HorseCard({
  horse,
  isFavorited = false,
  onFavoriteChange,
  labelsScope = "marketplace",
}: Props) {
  const t = useTranslations(labelsScope);
  const detailPath = getHorseDetailPath(horse);
  const canFavorite = Boolean(horse.listingUuid);
  const genderOptions =
    labelsScope === "home"
      ? {
          Mare: t("search.mare"),
          Stallion: t("search.stallion"),
          Gelding: t("search.gelding"),
        }
      : {
          Mare: t("advancedSearch.mare"),
          Stallion: t("advancedSearch.stallion"),
          Gelding: t("advancedSearch.gelding"),
        };

  const genderLabel =
    genderOptions[horse.gender as keyof typeof genderOptions] ??
    t("horseCard.genderUnknown");

  return (
    <Link href={detailPath}>
      <div className="group overflow-hidden rounded-3xl bg-[#111827] border border-white/10 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 cursor-pointer">
        <div className="relative overflow-hidden">
          <Image
            src={horse.images[0]}
            alt={t("horseCard.imageAlt", { name: horse.name })}
            width={600}
            height={420}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
            loading="lazy"
            className="w-full h-72 object-cover group-hover:scale-110 transition duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {horse.verified ? (
            <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
              {t("horseCard.verified")}
            </div>
          ) : null}

          {canFavorite ? (
            <FavoriteButton
              listingId={horse.listingUuid!}
              initialFavorited={isFavorited}
              returnPath={detailPath}
              onChange={onFavoriteChange}
            />
          ) : null}

          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md rounded-xl px-4 py-2">
            <p className="text-xs text-gray-300 uppercase">{t("horseCard.price")}</p>
            <p className="text-white font-bold text-xl">{horse.price}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5">
            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition">
              {horse.name}
            </h3>

            <p className="text-gray-400 mt-2">{horse.breed}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <InfoCard
              icon="🎂"
              label={t("horseCard.age")}
              value={t("horseCard.ageValue", { age: horse.age })}
            />
            <InfoCard
              icon="📏"
              label={t("horseCard.height")}
              value={t("horseCard.heightValue", { height: horse.height })}
            />
            <InfoCard icon="🐴" label={t("horseCard.gender")} value={genderLabel} />
            <InfoCard icon="🏆" label={t("horseCard.level")} value={horse.level} />
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase text-gray-500">{t("horseCard.location")}</p>
              <p className="truncate text-white font-medium">📍 {horse.country}</p>
            </div>

            <div className="inline-flex min-h-11 shrink-0 items-center self-start rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold transition group-hover:bg-blue-500 sm:self-auto">
              {t("horseCard.view")}
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

      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}
