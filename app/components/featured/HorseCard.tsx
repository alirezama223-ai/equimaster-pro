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
  /** Applies homepage-only mobile card styling below md. */
  homepageMobile?: boolean;
};

export default function HorseCard({
  horse,
  isFavorited = false,
  onFavoriteChange,
  labelsScope = "marketplace",
  homepageMobile = false,
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
    <Link href={detailPath} className={homepageMobile ? "block min-w-0 max-w-full" : undefined}>
      <div
        className={`group cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-[#111827] transition-all duration-500 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20 ${homepageMobile ? "max-md:min-w-0 max-md:max-w-full" : ""}`}
      >
        <div className="relative overflow-hidden">
          <Image
            src={horse.images[0]}
            alt={t("horseCard.imageAlt", { name: horse.name })}
            width={600}
            height={420}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
            loading="lazy"
            className={`w-full object-cover transition duration-700 group-hover:scale-110 ${homepageMobile ? "h-72 max-md:h-[220px]" : "h-72"}`}
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

          <div
            className={`absolute bottom-4 left-4 rounded-xl px-4 py-2 backdrop-blur-md ${homepageMobile ? "max-md:border max-md:border-blue-500/40 max-md:bg-blue-600/90" : "bg-black/60"}`}
          >
            <p className="text-xs uppercase text-gray-300 max-md:text-blue-100">{t("horseCard.price")}</p>
            <p
              className={`font-bold text-white ${homepageMobile ? "text-xl max-md:text-2xl max-md:text-blue-50" : "text-xl"}`}
            >
              {horse.price}
            </p>
          </div>
        </div>

        <div className={`p-6 ${homepageMobile ? "max-md:p-5" : ""}`}>
          <div className="mb-5">
            <h3
              className={`font-bold text-white transition group-hover:text-blue-400 ${homepageMobile ? "text-2xl max-md:text-[1.625rem] max-md:leading-tight" : "text-2xl"}`}
            >
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
