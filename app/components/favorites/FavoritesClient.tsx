"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import HorseCard from "@/app/components/featured/HorseCard";
import { Horse } from "@/app/data/horses";

type Props = {
  initialHorses: Horse[];
  initialFavoriteListingIds: string[];
};

export default function FavoritesClient({
  initialHorses,
  initialFavoriteListingIds,
}: Props) {
  const t = useTranslations("favorites");
  const [horses, setHorses] = useState(initialHorses);
  const [favoriteListingIds, setFavoriteListingIds] = useState(
    initialFavoriteListingIds
  );

  function handleFavoriteChange(listingId: string, favorited: boolean) {
    if (favorited) {
      setFavoriteListingIds((current) =>
        current.includes(listingId) ? current : [...current, listingId]
      );
      return;
    }

    setFavoriteListingIds((current) =>
      current.filter((id) => id !== listingId)
    );
    setHorses((current) =>
      current.filter((horse) => horse.listingUuid !== listingId)
    );
  }

  return (
    <section className="min-h-screen bg-[#0A1224] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-5xl font-bold text-white mb-12">
          {t("title")}
        </h1>

        {horses.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-8xl mb-8">🐴</div>
            <h2 className="text-3xl text-white font-bold">{t("emptyTitle")}</h2>
            <p className="text-gray-400 mt-4 max-w-md mx-auto">
              {t("emptyDescription")}
            </p>
            <Link
              href="/"
              className="inline-block mt-8 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
            >
              {t("browseMarketplace")}
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {horses.map((horse) => (
              <HorseCard
                key={horse.listingUuid ?? horse.id}
                horse={horse}
                isFavorited={
                  horse.listingUuid
                    ? favoriteListingIds.includes(horse.listingUuid)
                    : false
                }
                onFavoriteChange={
                  horse.listingUuid
                    ? (favorited) =>
                        handleFavoriteChange(horse.listingUuid!, favorited)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
