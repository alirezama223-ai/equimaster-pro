"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Navbar from "@/app/components/navbar/Navbar";
import HorseCard from "@/app/components/featured/HorseCard";
import FadeUp from "@/app/components/animations/FadeUp";
import { buildMarketplaceSearchQuery } from "@/app/lib/marketplace/search";
import { MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";
import type { Horse } from "@/app/data/horses";

type Props = {
  featuredHorses: Horse[];
  newestHorses: Horse[];
  breeds: string[];
  disciplines: string[];
  favoriteListingIds: string[];
};

export default function MarketplaceHomeClient({
  featuredHorses,
  newestHorses,
  breeds,
  disciplines,
  favoriteListingIds,
}: Props) {
  const t = useTranslations("marketplace");

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#111827] to-[#081223] p-8 sm:p-12 mb-12">
              <p className="uppercase tracking-[6px] text-blue-500 text-xs font-semibold">
                {t("home.eyebrow")}
              </p>
              <h1 className="text-4xl sm:text-6xl font-black mt-4 max-w-4xl">
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
                  className="flex-1 rounded-xl border border-white/10 bg-[#081223] px-4 py-4 text-white outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-4 font-semibold transition"
                >
                  {t("home.searchHorses")}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={MARKETPLACE_PATHS.createListing}
                  className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/5 transition"
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
            </section>
          </FadeUp>

          <ListingSection
            title={t("home.featuredTitle")}
            subtitle={t("home.featuredSubtitle")}
            horses={featuredHorses}
            favoriteListingIds={favoriteListingIds}
            emptyMessage={t("home.noListings")}
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
            <BrowseGroup
              title={t("home.browseByBreed")}
              items={breeds.slice(0, 12)}
              emptyMessage={t("home.noCategories")}
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
}: {
  title: string;
  subtitle: string;
  horses: Horse[];
  favoriteListingIds: string[];
  footerHref?: string;
  footerLabel?: string;
  emptyMessage: string;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="mt-2 text-gray-400">{subtitle}</p>
        </div>
        {footerHref && footerLabel ? (
          <Link href={footerHref} className="text-sm text-blue-300 hover:text-blue-200">
            {footerLabel}
          </Link>
        ) : null}
      </div>

      {horses.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {horses.map((horse) => (
            <HorseCard
              key={horse.listingUuid ?? horse.id}
              horse={horse}
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
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:border-blue-500/40 hover:text-white transition"
            >
              {item}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
