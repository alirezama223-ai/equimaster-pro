"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import Navbar from "@/app/components/navbar/Navbar";
import HeroSection from "@/app/components/hero/HeroSection";
import FadeUp from "@/app/components/animations/FadeUp";

import type { HeroStats } from "@/app/actions/home-stats";
import { Horse } from "@/app/data/horses";
import {
  DEFAULT_SORT,
  filterAndSortHorses,
  SortOption,
} from "@/app/lib/horse-filters";

const AdvancedSearch = dynamic(() => import("@/app/components/search/AdvancedSearch"), {
  loading: () => (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-hidden="true">
      <div className="h-48 animate-pulse rounded-3xl bg-white/5" />
    </div>
  ),
});

const FeaturedHorses = dynamic(() => import("@/app/components/featured/FeaturedHorses"), {
  loading: () => (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-hidden="true">
      <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-96 animate-pulse rounded-3xl bg-white/5" />
        ))}
      </div>
    </div>
  ),
});

const HORSES_PER_PAGE = 6;

type Props = {
  marketplaceHorses: Horse[];
  favoriteListingIds?: string[];
  heroStats: HeroStats;
  premiumStallions: React.ReactNode;
};

export default function HomeClient({
  marketplaceHorses,
  favoriteListingIds = [],
  heroStats,
  premiumStallions,
}: Props) {
  const t = useTranslations("home");
  const [search, setSearchState] = useState("");
  const [breed, setBreedState] = useState("All");
  const [country, setCountryState] = useState("All");
  const [gender, setGenderState] = useState("All");
  const [discipline, setDisciplineState] = useState("All");
  const [verified, setVerifiedState] = useState(false);

  const [minPrice, setMinPriceState] = useState("");
  const [maxPrice, setMaxPriceState] = useState("");
  const [minAge, setMinAgeState] = useState("");
  const [maxAge, setMaxAgeState] = useState("");
  const [minHeight, setMinHeightState] = useState("");
  const [maxHeight, setMaxHeightState] = useState("");
  const [sort, setSortState] = useState<SortOption>(DEFAULT_SORT);

  const [currentPage, setCurrentPage] = useState(1);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setCurrentPage(1);
  }, []);

  const setBreed = useCallback((value: string) => {
    setBreedState(value);
    setCurrentPage(1);
  }, []);

  const setCountry = useCallback((value: string) => {
    setCountryState(value);
    setCurrentPage(1);
  }, []);

  const setGender = useCallback((value: string) => {
    setGenderState(value);
    setCurrentPage(1);
  }, []);

  const setDiscipline = useCallback((value: string) => {
    setDisciplineState(value);
    setCurrentPage(1);
  }, []);

  const setVerified = useCallback((value: boolean) => {
    setVerifiedState(value);
    setCurrentPage(1);
  }, []);

  const setMinPrice = useCallback((value: string) => {
    setMinPriceState(value);
    setCurrentPage(1);
  }, []);

  const setMaxPrice = useCallback((value: string) => {
    setMaxPriceState(value);
    setCurrentPage(1);
  }, []);

  const setMinAge = useCallback((value: string) => {
    setMinAgeState(value);
    setCurrentPage(1);
  }, []);

  const setMaxAge = useCallback((value: string) => {
    setMaxAgeState(value);
    setCurrentPage(1);
  }, []);

  const setMinHeight = useCallback((value: string) => {
    setMinHeightState(value);
    setCurrentPage(1);
  }, []);

  const setMaxHeight = useCallback((value: string) => {
    setMaxHeightState(value);
    setCurrentPage(1);
  }, []);

  const setSort = useCallback((value: SortOption) => {
    setSortState(value);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState("");
    setBreedState("All");
    setCountryState("All");
    setGenderState("All");
    setDisciplineState("All");
    setVerifiedState(false);
    setMinPriceState("");
    setMaxPriceState("");
    setMinAgeState("");
    setMaxAgeState("");
    setMinHeightState("");
    setMaxHeightState("");
    setSortState(DEFAULT_SORT);
    setCurrentPage(1);
  }, []);

  const filteredHorses = useMemo(() => {
    return filterAndSortHorses(marketplaceHorses, {
      search,
      breed,
      country,
      gender,
      discipline,
      verified,
      minPrice,
      maxPrice,
      minAge,
      maxAge,
      minHeight,
      maxHeight,
      sort,
    });
  }, [
    marketplaceHorses,
    search,
    breed,
    country,
    gender,
    discipline,
    verified,
    minPrice,
    maxPrice,
    minAge,
    maxAge,
    minHeight,
    maxHeight,
    sort,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHorses.length / HORSES_PER_PAGE)
  );

  const effectivePage = Math.min(currentPage, totalPages);

  const displayedHorses = filteredHorses.slice(
    (effectivePage - 1) * HORSES_PER_PAGE,
    effectivePage * HORSES_PER_PAGE
  );

  return (
    <>
      <Navbar />

      <HeroSection stats={heroStats} />

      <FadeUp>
        <AdvancedSearch
          search={search}
          setSearch={setSearch}
          breed={breed}
          setBreed={setBreed}
          country={country}
          setCountry={setCountry}
          gender={gender}
          setGender={setGender}
          discipline={discipline}
          setDiscipline={setDiscipline}
          verified={verified}
          setVerified={setVerified}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          minAge={minAge}
          setMinAge={setMinAge}
          maxAge={maxAge}
          setMaxAge={setMaxAge}
          minHeight={minHeight}
          setMinHeight={setMinHeight}
          maxHeight={maxHeight}
          setMaxHeight={setMaxHeight}
          sort={sort}
          setSort={setSort}
          onResetFilters={resetFilters}
        />
      </FadeUp>

      <FeaturedHorses
        horses={displayedHorses}
        favoriteListingIds={favoriteListingIds}
      />

      {totalPages > 1 && (
        <section className="bg-[#08111F] pb-24">
          <div className="flex flex-wrap justify-center gap-3 px-4">
            <button
              type="button"
              disabled={effectivePage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-5 py-3 rounded-xl bg-[#111827] text-white disabled:opacity-40"
            >
              {t("pagination.previous")}
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                aria-label={t("pagination.pageAria", { page })}
                aria-current={page === effectivePage ? "page" : undefined}
                onClick={() => setCurrentPage(page)}
                className={`w-12 h-12 rounded-xl font-bold transition ${
                  page === effectivePage
                    ? "bg-blue-600 text-white"
                    : "bg-[#111827] text-gray-300 hover:bg-blue-600"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={effectivePage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-5 py-3 rounded-xl bg-[#111827] text-white disabled:opacity-40"
            >
              {t("pagination.next")}
            </button>
          </div>
        </section>
      )}

      <FadeUp>{premiumStallions}</FadeUp>
    </>
  );
}
