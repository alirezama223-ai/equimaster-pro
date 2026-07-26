"use client";

import Link from "next/link";
import Image from "next/image";
import { Horse } from "../../data/horses";
import { getHorseDetailPath } from "../../lib/horse-listings";
import FavoriteButton from "@/app/components/favorites/FavoriteButton";

type Props = {
  horse: Horse;
  isFavorited?: boolean;
  onFavoriteChange?: (favorited: boolean) => void;
};

export default function HorseCard({
  horse,
  isFavorited = false,
  onFavoriteChange,
}: Props) {
  const detailPath = getHorseDetailPath(horse);
  const canFavorite = Boolean(horse.listingUuid);

  return (
    <Link href={detailPath}>
      <div className="group overflow-hidden rounded-3xl bg-[#111827] border border-white/10 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 cursor-pointer">
        {/* Image */}
        <div className="relative overflow-hidden">
          <Image
            src={horse.images[0]}
            alt={horse.name}
            width={600}
            height={420}
            className="w-full h-72 object-cover group-hover:scale-110 transition duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {horse.verified && (
            <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
              ✔ VERIFIED
            </div>
          )}

          {canFavorite ? (
            <FavoriteButton
              listingId={horse.listingUuid!}
              initialFavorited={isFavorited}
              returnPath={detailPath}
              onChange={onFavoriteChange}
            />
          ) : null}

          {/* Price */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md rounded-xl px-4 py-2">
            <p className="text-xs text-gray-300 uppercase">Price</p>
            <p className="text-white font-bold text-xl">{horse.price}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-5">
            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition">
              {horse.name}
            </h3>

            <p className="text-gray-400 mt-2">{horse.breed}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <InfoCard icon="🎂" label="Age" value={`${horse.age} yrs`} />
            <InfoCard icon="📏" label="Height" value={`${horse.height} cm`} />
            <InfoCard icon="🐴" label="Gender" value={horse.gender} />
            <InfoCard icon="🏆" label="Level" value={horse.level} />
          </div>

          <div className="flex justify-between items-center border-t border-white/10 pt-5">
            <div>
              <p className="text-xs uppercase text-gray-500">Location</p>
              <p className="text-white font-medium">📍 {horse.country}</p>
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
        <span className="text-xs uppercase tracking-wide text-gray-400">
          {label}
        </span>
      </div>

      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}
