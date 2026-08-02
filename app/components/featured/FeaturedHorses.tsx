"use client";

import { useTranslations } from "next-intl";
import HorseCard from "./HorseCard";
import FadeUp from "../animations/FadeUp";
import { Horse } from "@/app/data/horses";

type Props = {
  horses: Horse[];
  favoriteListingIds?: string[];
};

export default function FeaturedHorses({ horses, favoriteListingIds = [] }: Props) {
  const t = useTranslations("home.featured");

  return (
    <section className="bg-[#08111F] py-32">
      <div className="max-w-7xl mx-auto px-6">
        <FadeUp>
          <div className="text-center mb-16">
            <p className="uppercase tracking-[6px] text-blue-500 text-sm font-semibold">
              {t("eyebrow")}
            </p>

            <h2 className="mt-4 text-6xl font-black text-white">{t("title")}</h2>

            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400">{t("subtitle")}</p>
          </div>
        </FadeUp>

        {horses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-6" aria-hidden="true">
              {t("emptyIcon")}
            </div>

            <h3 className="text-3xl font-bold text-white">{t("emptyTitle")}</h3>

            <p className="text-gray-400 mt-4">{t("emptyDescription")}</p>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
            {horses.map((horse) => (
              <FadeUp key={horse.listingUuid ?? horse.id}>
                <HorseCard
                  horse={horse}
                  labelsScope="home"
                  isFavorited={
                    horse.listingUuid
                      ? favoriteListingIds.includes(horse.listingUuid)
                      : false
                  }
                />
              </FadeUp>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
