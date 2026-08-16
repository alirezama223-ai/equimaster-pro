"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Navbar from "@/app/components/navbar/Navbar";
import MarketplaceListingCard from "@/app/components/marketplace/MarketplaceListingCard";
import FadeUp from "@/app/components/animations/FadeUp";
import { SHABDIZ_BRAND } from "@/app/lib/brand";
import { buildMarketplaceSearchQuery } from "@/app/lib/marketplace/search";
import { MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";
import type { Horse } from "@/app/data/horses";

type Props = {
  featuredHorses: Horse[];
  newestHorses: Horse[];
  breeds: string[];
  featuredBreeds: string[];
  disciplines: string[];
  favoriteListingIds: string[];
};

const HERO_VIDEO = "/happy-horse-1.1_The_horse_must_remain_entirely_within_the_right_40_percent_of_the_frame_througho-0%20(1).mp4";
const HERO_POSTER = "/shabdiz-hero.png";

export default function MarketplaceHomeClient({
  featuredHorses,
  newestHorses,
  breeds,
  featuredBreeds,
  disciplines,
  favoriteListingIds,
}: Props) {
  const t = useTranslations("marketplace");

  return (
    <>
      <Navbar />

      <main className="min-h-screen overflow-x-hidden bg-[#081223] text-white pt-28 pb-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <FadeUp>
            <section className="relative isolate min-h-[620px] overflow-hidden rounded-3xl border border-[#D4A437]/25 bg-[#081223] mb-12">
              <video
                className="absolute inset-0 h-full w-full object-cover object-center"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={HERO_POSTER}
                aria-hidden="true"
              >
                <source src={HERO_VIDEO} type="video/mp4" />
              </video>

              <div className="absolute inset-0 bg-gradient-to-r from-[#081223] via-[#081223]/90 via-45% to-[#081223]/15" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081223]/55 via-transparent to-[#081223]/10" />

              <div className="relative z-10 flex min-h-[620px] items-center px-6 py-12 sm:px-12 lg:px-16">
                <div className="max-w-3xl">
                  <div className="mb-7 flex items-center gap-3">
                    <img
                      src={SHABDIZ_BRAND.mark}
                      alt=""
                      aria-hidden="true"
                      className="h-11 w-11 rounded-xl object-contain"
                    />
                    <div>
                      <p className="text-sm font-bold tracking-[0.22em] text-[#D4A437]">
                        {SHABDIZ_BRAND.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-gray-300/80">
                        {SHABDIZ_BRAND.descriptor}
                      </p>
                    </div>
                  </div>

                  <p className="uppercase tracking-[0.2em] text-[#D4A437] text-xs font-semibold sm:tracking-[6px]">
                    {t("home.eyebrow")}
                  </p>
                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[0.98] mt-4 max-w-4xl drop-shadow-[0_3px_18px_rgba(0,0,0,0.35)]">
                    {t("home.title")}
                  </h1>
                  <p className="mt-6 max-w-2xl text-base sm:text-lg text-gray-200/90">
                    {t("home.subtitle")}
                  </p>

                  <form
                    action="/horses"
                    method="get"
                    className="mt-8 flex flex-col sm:flex-row gap-3 max-w-3xl"
                  >
                    <input
                      type="search"
                      name="q"
                      placeholder={t("home.searchPlaceholder")}
                      className="flex-1 rounded-xl border border-white/15 bg-[#081223]/75 px-4 py-4 text-white backdrop-blur-sm outline-none placeholder:text-gray-400 focus:border-[#D4A437]"
                    />
                    <button
                      type="submit"
                      className="min-h-11 rounded-xl bg-[#D4A437] px-6 py-4 font-bold text-[#081223] transition hover:bg-[#F7E1A1]"
                    >
                      {t("home.searchHorses")}
                    </button>
                  </form>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={MARKETPLACE_PATHS.createListing}
                      className="rounded-xl border border-[#D4A437]/50 bg-[#081223]/35 px-5 py-3 text-sm font-semibold backdrop-blur-sm hover:bg-[#D4A437]/10 transition"
                    >
                      {t("home.sellAHorse")}
                    </Link>
                    <Link
                      href={MARKETPLACE_PATHS.sellerDashboard}
                      className="rounded-xl border border-white/20 bg-[#081223]/30 px-5 py-3 text-sm font-semibold backdrop-blur-sm hover:bg-white/5 transition"
                    >
                      {t("home.sellerDashboard")}
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </FadeUp>

          <ListingSection
            title={t("home.featuredTitle")}
            subtitle={t("home.featuredSubtitle")}
            horses={featuredHorses}
            favoriteListingIds={favoriteListingIds}
            emptyMessage={t("home.noListings")}
            featured
          />

          <ListingSection
            title={t("home.newestTitle")}
            subtitle={t("home.newestSubtitle")}
            horses={newestHorses}
            favoriteListingIds={favoriteListingIds}
            footerHref="/horses"
            footerLabel={t("home.viewAllHorses")}
            emptyMessage={t("home.noListings")}
          />

          <section className="mt-16 grid gap-8 lg:grid-cols-2">
            <BreedBrowseGroup
              title={t("home.browseByBreed")}
              featuredItems={featuredBreeds}
              allItems={breeds}
              emptyMessage={t("home.noCategories")}
              viewAllLabel={t("home.viewAllBreeds")}
              showFeaturedLabel={t("home.showFeaturedBreeds")}
              buildHref={(breed) => `/horses${buildMarketplaceSearchQuery({ breed })}`}
            />
            <BrowseGroup
              title={t("home.browseByDiscipline")}
              items={disciplines.slice(0, 12)}
              emptyMessage={t("home.noCategories")}
              buildHref={(discipline) =>
                `/horses${buildMarketplaceSearchQuery({ discipline })}`
              }
            />
          </section>
        </div>
      </main>
    </>
  );
}

function ListingSection({
  title,
  subtitle,
  horses,
  favoriteListingIds,
  footerHref,
  footerLabel,
  emptyMessage,
  featured = false,
}: {
  title: string;
  subtitle: string;
  horses: Horse[];
  favoriteListingIds: string[];
  footerHref?: string;
  footerLabel?: string;
  emptyMessage: string;
  featured?: boolean;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="mt-2 text-gray-400">{subtitle}</p>
        </div>
        {footerHref && footerLabel ? (
          <Link href={footerHref} className="text-sm text-[#D4A437] hover:text-[#F7E1A1]">
            {footerLabel}
          </Link>
        ) : null}
      </div>

      {horses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-2 lg:gap-8 xl:grid-cols-3">
          {horses.map((horse) => (
            <MarketplaceListingCard
              key={horse.listingUuid ?? horse.id}
              horse={horse}
              featured={featured}
              isFavorited={Boolean(
                horse.listingUuid && favoriteListingIds.includes(horse.listingUuid)
              )}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center text-gray-400">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

function BreedBrowseGroup({
  title,
  featuredItems,
  allItems,
  emptyMessage,
  viewAllLabel,
  showFeaturedLabel,
  buildHref,
}: {
  title: string;
  featuredItems: string[];
  allItems: string[];
  emptyMessage: string;
  viewAllLabel: string;
  showFeaturedLabel: string;
  buildHref: (item: string) => string;
}) {
  const [showAll, setShowAll] = useState(false);
  const hasMoreBreeds = allItems.length > featuredItems.length;
  const items = showAll ? allItems : featuredItems;

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {hasMoreBreeds ? (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="shrink-0 text-sm text-[#D4A437] hover:text-[#F7E1A1] transition"
          >
            {showAll ? showFeaturedLabel : viewAllLabel}
          </button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <Link
              key={item}
              href={buildHref(item)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:border-[#D4A437]/40 hover:text-white transition"
            >
              {item}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function BrowseGroup({
  title,
  items,
  emptyMessage,
  buildHref,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
  buildHref: (item: string) => string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <Link
              key={item}
              href={buildHref(item)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:border-[#D4A437]/40 hover:text-white transition"
            >
              {item}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
