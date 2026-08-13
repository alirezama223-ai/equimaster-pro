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
            <section className="relative overflow-hidden rounded-3xl border border-[#D4A437]/25 bg-gradient-to-br from-[#111827] to-[#081223] p-5 sm:p-12 mb-12">
              <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-[#D4A437]/10" />
              <div className="pointer-events-none absolute -right-4 -top-8 h-52 w-52 rounded-full border border-[#D4A437]/10" />
              <div className="relative z-10">
                <div className="mb-6 flex items-center gap-3">
                  <img
                    src={SHABDIZ_BRAND.mark}
                    alt=""
                    aria-hidden="true"
                    className="h-11 w-11 rounded-xl"
                  />
                  <div>
                    <p className="text-sm font-bold tracking-[0.22em] text-[#D4A437]">
                      {SHABDIZ_BRAND.name}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-gray-400">
                      {SHABDIZ_BRAND.descriptor}
                    </p>
                  </div>
                </div>
                <p className="uppercase tracking-[0.2em] text-[#D4A437] text-xs font-semibold sm:tracking-[6px]">
                  {t("home.eyebrow")}
                </p>
                <h1 className="text-3xl sm:text-6xl font-black mt-4 max-w-4xl">
                  {t("home.title")}
                </h1>
                <p className="mt-5 max-w-2xl text-gray-400 text-lg">{t("home.subtitle")}</p>

                <form
                  action="/horses"
                  method="get"
                  className="mt-8 flex flex-col sm:flex-row gap-3 max-w-3xl"
                >
                  <input
                    type="search"
                    name="q"
                    placeholder={t("home.searchPlaceholder")}
                    className="flex-1 rounded-xl border border-white/10 bg-[#081223] px-4 py-4 text-white outline-none focus:border-[#D4A437]"
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
                    className="rounded-xl border border-[#D4A437]/40 px-5 py-3 text-sm font-semibold hover:bg-[#D4A437]/10 transition"
                  >
                    {t("home.sellAHorse")}
                  </Link>
                  <Link
                    href={MARKETPLACE_PATHS.sellerDashboard}
                    className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/5 transition"
                  >
                    {t("home.sellerDashboard")}
                  </Link>
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
