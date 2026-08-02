"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import Navbar from "@/app/components/navbar/Navbar";
import HorseCard from "@/app/components/featured/HorseCard";
import FadeUp from "@/app/components/animations/FadeUp";
import SearchableSelect from "@/app/components/shared/SearchableSelect";
import EmptyState from "@/app/components/shared/EmptyState";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { getBreedSelectOptions } from "@/app/lib/breeds";
import { getCountrySelectOptions } from "@/app/lib/constants/countries";
import { getDisciplineSelectOptions } from "@/app/lib/constants/disciplines";
import {
  countActiveMarketplaceFilters,
  DEFAULT_MARKETPLACE_FILTERS,
  draftInputsFromFilters,
  filtersFromDraftInputs,
  getMarketplaceFilterChipDefinitions,
  marketplaceFiltersQuery,
  mergeMarketplaceFilters,
  type MarketplaceDraftInputs,
} from "@/app/lib/marketplace/filter-utils";
import { buildMarketplaceSearchQuery } from "@/app/lib/marketplace/search";
import type { Horse } from "@/app/data/horses";
import type {
  MarketplaceAvailabilityFilter,
  MarketplaceSearchParams,
  MarketplaceSearchResult,
  MarketplaceSortOption,
} from "@/app/types/marketplace";

const countryOptions = getCountrySelectOptions();
const disciplineOptions = getDisciplineSelectOptions();
const breedOptions = getBreedSelectOptions();

const sortOptions = [
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "age-asc",
  "age-desc",
  "height-asc",
  "height-desc",
  "featured",
] as const satisfies readonly MarketplaceSortOption[];

const availabilityOptions = ["all", "priced", "on_request"] as const satisfies readonly MarketplaceAvailabilityFilter[];

const SEARCH_DEBOUNCE_MS = 350;

const DRAFT_FIELD_KEYS = [
  "q",
  "minPrice",
  "maxPrice",
  "minAge",
  "maxAge",
  "minHeight",
  "maxHeight",
  "color",
  "studbook",
] as const;

type Props = {
  horses: Horse[];
  result: MarketplaceSearchResult;
  filters: MarketplaceSearchParams;
  filterOptions: {
    breeds: string[];
    countries: string[];
    disciplines: string[];
    levels: string[];
  };
  favoriteListingIds: string[];
  searchError?: string;
};

export default function MarketplaceBrowseClient({
  horses,
  result,
  filters,
  filterOptions,
  favoriteListingIds,
  searchError,
}: Props) {
  const t = useTranslations("marketplace");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localFilters, setLocalFilters] = useState(filters);
  const [draftInputs, setDraftInputs] = useState<MarketplaceDraftInputs>(() =>
    draftInputsFromFilters(filters)
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const skipDebouncedPushRef = useRef(false);

  useEffect(() => {
    skipDebouncedPushRef.current = true;
    /* eslint-disable react-hooks/set-state-in-effect -- Keep draft inputs aligned with URL-driven filters. */
    setLocalFilters(filters);
    setDraftInputs(draftInputsFromFilters(filters));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [filters]);

  const debouncedDraftInputs = useDebouncedValue(draftInputs, SEARCH_DEBOUNCE_MS);

  const pushFilters = useCallback(
    (next: MarketplaceSearchParams) => {
      startTransition(() => {
        router.push(`/horses${buildMarketplaceSearchQuery(next)}`);
      });
    },
    [router]
  );

  const updateFilters = useCallback(
    (patch: Partial<MarketplaceSearchParams>, options?: { resetPage?: boolean }) => {
      const shouldResetPage = options?.resetPage ?? !("page" in patch);
      const next = mergeMarketplaceFilters(localFilters, {
        ...patch,
        page: patch.page ?? (shouldResetPage ? 1 : localFilters.page ?? 1),
      });
      setLocalFilters(next);
      if (
        Object.keys(patch).some((key) =>
          DRAFT_FIELD_KEYS.includes(key as (typeof DRAFT_FIELD_KEYS)[number])
        )
      ) {
        setDraftInputs(draftInputsFromFilters(next));
      }
      pushFilters(next);
    },
    [localFilters, pushFilters]
  );

  useEffect(() => {
    if (skipDebouncedPushRef.current) {
      skipDebouncedPushRef.current = false;
      return;
    }

    const draftPatch = filtersFromDraftInputs(debouncedDraftInputs);
    const next = mergeMarketplaceFilters(filters, {
      ...draftPatch,
      page: 1,
    });

    if (marketplaceFiltersQuery(next) === marketplaceFiltersQuery(filters)) {
      return;
    }

    pushFilters(next);
  }, [debouncedDraftInputs, filters, pushFilters]);

  const clearAllFilters = useCallback(() => {
    const next = { ...DEFAULT_MARKETPLACE_FILTERS };
    setLocalFilters(next);
    setDraftInputs(draftInputsFromFilters(next));
    setMobileFiltersOpen(false);
    pushFilters(next);
  }, [pushFilters]);

  const activeFilterCount = useMemo(
    () => countActiveMarketplaceFilters(filters),
    [filters]
  );

  const filterChips = useMemo(
    () => getMarketplaceFilterChipDefinitions(filters),
    [filters]
  );

  const levelSelectOptions = useMemo(
    () =>
      filterOptions.levels.map((level) => ({
        value: level,
        label: level,
        searchText: level,
      })),
    [filterOptions.levels]
  );

  const genderLabels = useMemo(
    () => ({
      All: t("advancedSearch.allGenders"),
      Mare: t("advancedSearch.mare"),
      Stallion: t("advancedSearch.stallion"),
      Gelding: t("advancedSearch.gelding"),
    }),
    [t]
  );

  const availabilityLabels = useMemo(
    () => ({
      all: t("browse.allAvailability"),
      priced: t("browse.availabilityPriced"),
      on_request: t("browse.availabilityOnRequest"),
    }),
    [t]
  );

  const getChipLabel = useCallback(
    (chipId: string) => {
      switch (chipId) {
        case "q":
          return t("browse.chips.search", { value: filters.q ?? "" });
        case "breed":
          return t("browse.chips.breed", { value: filters.breed ?? "" });
        case "country":
          return t("browse.chips.location", { value: filters.country ?? "" });
        case "gender":
          return t("browse.chips.gender", {
            value: genderLabels[filters.gender as keyof typeof genderLabels] ?? filters.gender ?? "",
          });
        case "discipline":
          return t("browse.chips.discipline", { value: filters.discipline ?? "" });
        case "level":
          return t("browse.chips.level", { value: filters.level ?? "" });
        case "studbook":
          return t("browse.chips.studbook", { value: filters.studbook ?? "" });
        case "availability":
          return t("browse.chips.availability", {
            value: availabilityLabels[filters.availability ?? "all"],
          });
        case "color":
          return t("browse.chips.color", { value: filters.color ?? "" });
        case "verified":
          return t("browse.chips.verified");
        case "price":
          return t("browse.chips.price", {
            min: filters.minPrice ?? "",
            max: filters.maxPrice ?? "",
          });
        case "age":
          return t("browse.chips.age", {
            min: filters.minAge ?? "",
            max: filters.maxAge ?? "",
          });
        case "height":
          return t("browse.chips.height", {
            min: filters.minHeight ?? "",
            max: filters.maxHeight ?? "",
          });
        default:
          return chipId;
      }
    },
    [availabilityLabels, filters, genderLabels, t]
  );

  const applyDraftFilters = useCallback(() => {
    const draftPatch = filtersFromDraftInputs(draftInputs);
    updateFilters(draftPatch);
    setMobileFiltersOpen(false);
  }, [draftInputs, updateFilters]);

  const handleFilterSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      applyDraftFilters();
    },
    [applyDraftFilters]
  );

  const pageNumbers = useMemo(() => {
    if (result.totalPages <= 1) {
      return [] as number[];
    }

    const windowSize = 7;
    let start = Math.max(1, result.page - Math.floor(windowSize / 2));
    const end = Math.min(result.totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    const pages: number[] = [];
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }, [result.page, result.totalPages]);

  const favoriteIdSet = useMemo(
    () => new Set(favoriteListingIds),
    [favoriteListingIds]
  );

  const filterPanelProps = {
    t,
    localFilters,
    draftInputs,
    setDraftInputs,
    updateFilters,
    genderLabels,
    availabilityLabels,
    levelSelectOptions,
    onSubmit: handleFilterSubmit,
    isPending,
    clearAllFilters,
    activeFilterCount,
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeUp>
            <section className="mb-8 lg:mb-10">
              <p className="uppercase tracking-[6px] text-blue-500 text-xs font-semibold">
                {t("browse.eyebrow")}
              </p>
              <h1 className="text-4xl sm:text-5xl font-black mt-4">{t("browse.title")}</h1>
              <p className="mt-4 max-w-3xl text-gray-400 text-lg">{t("browse.subtitle")}</p>
            </section>
          </FadeUp>

          <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <p className="text-sm text-gray-400">
              {activeFilterCount > 0
                ? t("browse.activeFilters", { count: activeFilterCount })
                : t("browse.noActiveFilters")}
            </p>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="rounded-xl border border-blue-500/40 bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-300"
            >
              {t("browse.openFilters")}
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(280px,340px)_1fr] lg:gap-8 lg:items-start">
            <aside className="hidden lg:block lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
              <section className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6">
                <FilterPanel {...filterPanelProps} layout="desktop" />
              </section>
            </aside>

            <div className="min-w-0">
              {filterChips.length > 0 ? (
                <div className="mb-6 flex flex-wrap gap-2">
                  {filterChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => updateFilters(chip.removePatch)}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-600/10 px-3 py-1.5 text-sm text-blue-100 hover:bg-blue-600/20 transition"
                      aria-label={t("browse.removeFilter", { filter: getChipLabel(chip.id) })}
                    >
                      <span>{getChipLabel(chip.id)}</span>
                      <span aria-hidden="true" className="text-blue-300">
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {searchError ? (
                <ErrorState message={t("browse.networkError")} className="mb-6" />
              ) : null}

              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-gray-400">
                  {t("browse.listingsFound", { count: result.total })}
                  {isPending ? ` · ${t("browse.searching")}` : null}
                </p>
                <Link href="/sell" className="text-sm text-blue-300 hover:text-blue-200">
                  {t("browse.sellAHorse")}
                </Link>
              </div>

              {isPending && horses.length === 0 ? (
                <LoadingState message={t("browse.loadingResults")} className="py-16 text-center" />
              ) : horses.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {horses.map((horse) => (
                    <HorseCard
                      key={horse.listingUuid ?? horse.id}
                      horse={horse}
                      isFavorited={Boolean(
                        horse.listingUuid && favoriteIdSet.has(horse.listingUuid)
                      )}
                    />
                  ))}
                </div>
              ) : searchError ? (
                <EmptyState
                  title={t("browse.emptyErrorTitle")}
                  description={t("browse.emptyErrorDescription")}
                  className="py-16"
                />
              ) : (
                <EmptyState
                  title={t("browse.emptyResultsTitle")}
                  description={t("browse.noResults")}
                  className="py-16"
                />
              )}

              {result.totalPages > 1 ? (
                <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={result.page <= 1 || isPending}
                    onClick={() => updateFilters({ page: result.page - 1 }, { resetPage: false })}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5 disabled:opacity-40"
                  >
                    {t("browse.previous")}
                  </button>
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => updateFilters({ page }, { resetPage: false })}
                      className={`min-w-10 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        page === result.page
                          ? "bg-blue-600 text-white"
                          : "border border-white/10 text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={result.page >= result.totalPages || isPending}
                    onClick={() => updateFilters({ page: result.page + 1 }, { resetPage: false })}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5 disabled:opacity-40"
                  >
                    {t("browse.next")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("browse.closeFilters")}
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111827] p-5 pb-8 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <FilterPanel
              {...filterPanelProps}
              layout="mobile"
              onClose={() => setMobileFiltersOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

type FilterPanelProps = {
  t: ReturnType<typeof useTranslations<"marketplace">>;
  localFilters: MarketplaceSearchParams;
  draftInputs: MarketplaceDraftInputs;
  setDraftInputs: Dispatch<SetStateAction<MarketplaceDraftInputs>>;
  updateFilters: (
    patch: Partial<MarketplaceSearchParams>,
    options?: { resetPage?: boolean }
  ) => void;
  genderLabels: Record<string, string>;
  availabilityLabels: Record<MarketplaceAvailabilityFilter, string>;
  levelSelectOptions: ReturnType<typeof getCountrySelectOptions>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  clearAllFilters: () => void;
  activeFilterCount: number;
  layout: "desktop" | "mobile";
  onClose?: () => void;
};

const FilterPanel = memo(function FilterPanel({
  t,
  localFilters,
  draftInputs,
  setDraftInputs,
  updateFilters,
  genderLabels,
  availabilityLabels,
  levelSelectOptions,
  onSubmit,
  isPending,
  clearAllFilters,
  activeFilterCount,
  layout,
  onClose,
}: FilterPanelProps) {
  const inputClassName =
    "mt-2 w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white outline-none focus:border-blue-500";

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {activeFilterCount > 0
            ? t("browse.activeFilters", { count: activeFilterCount })
            : t("browse.noActiveFilters")}
        </p>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={isPending}
              className="rounded-xl border border-blue-500/40 bg-blue-600/10 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-600 hover:text-white transition disabled:opacity-60"
            >
              {t("browse.clearAllFilters")}
            </button>
          ) : null}
          {layout === "mobile" && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300"
            >
              {t("browse.closeFilters")}
            </button>
          ) : null}
        </div>
      </div>

      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {t("browse.searchLabel")}
          </span>
          <input
            type="search"
            value={draftInputs.q}
            onChange={(event) =>
              setDraftInputs((current) => ({ ...current, q: event.target.value }))
            }
            placeholder={t("browse.searchPlaceholder")}
            className={inputClassName}
          />
        </label>

        <FilterSearchableSelect
          label={t("browse.discipline")}
          value={localFilters.discipline ?? "All"}
          options={disciplineOptions}
          emptyOption={{ value: "All", label: t("browse.allDisciplines") }}
          placeholder={t("browse.allPlaceholder", { label: t("browse.discipline") })}
          onChange={(value) => updateFilters({ discipline: value })}
        />

        <FilterSearchableSelect
          label={t("browse.country")}
          value={localFilters.country ?? "All"}
          options={countryOptions}
          emptyOption={{ value: "All", label: t("browse.allCountries") }}
          placeholder={t("browse.allPlaceholder", { label: t("browse.country") })}
          onChange={(value) => updateFilters({ country: value })}
        />

        <FilterSearchableSelect
          label={t("browse.breed")}
          value={localFilters.breed ?? "All"}
          options={breedOptions}
          emptyOption={{ value: "All", label: t("browse.allBreeds") }}
          placeholder={t("browse.allPlaceholder", { label: t("browse.breed") })}
          onChange={(value) => updateFilters({ breed: value })}
        />

        <FilterSearchableSelect
          label={t("browse.trainingLevel")}
          value={localFilters.level ?? "All"}
          options={levelSelectOptions}
          emptyOption={{ value: "All", label: t("browse.allTrainingLevels") }}
          placeholder={t("browse.allPlaceholder", { label: t("browse.trainingLevel") })}
          onChange={(value) => updateFilters({ level: value })}
        />

        <FilterSelect
          label={t("browse.gender")}
          value={localFilters.gender ?? "All"}
          options={["All", "Mare", "Stallion", "Gelding"]}
          labels={genderLabels}
          onChange={(value) => updateFilters({ gender: value })}
        />

        <label className="block">
          <span className="text-xs uppercase tracking-wide text-gray-500">{t("browse.color")}</span>
          <input
            type="text"
            value={draftInputs.color}
            onChange={(event) =>
              setDraftInputs((current) => ({ ...current, color: event.target.value }))
            }
            placeholder={t("browse.colorPlaceholder")}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wide text-gray-500">{t("browse.studbook")}</span>
          <input
            type="text"
            value={draftInputs.studbook}
            onChange={(event) =>
              setDraftInputs((current) => ({ ...current, studbook: event.target.value }))
            }
            placeholder={t("browse.studbookPlaceholder")}
            className={inputClassName}
          />
        </label>

        <FilterSelect
          label={t("browse.availability")}
          value={localFilters.availability ?? "all"}
          options={[...availabilityOptions]}
          labels={availabilityLabels}
          onChange={(value) =>
            updateFilters({ availability: value as MarketplaceAvailabilityFilter })
          }
        />

        <FilterSelect
          label={t("browse.sort")}
          value={localFilters.sort ?? "newest"}
          options={[...sortOptions]}
          labels={Object.fromEntries(
            sortOptions.map((option) => [option, t(`browse.sortOptions.${option}`)])
          )}
          onChange={(value) => updateFilters({ sort: value as MarketplaceSortOption })}
        />

        <label className="flex items-end">
          <span className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white min-h-[50px] cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(localFilters.verified)}
              onChange={(event) => updateFilters({ verified: event.target.checked })}
              className="h-5 w-5"
            />
            <span className="text-sm">{t("browse.verifiedOnly")}</span>
          </span>
        </label>

        <FilterNumberInput
          label={t("browse.minPrice")}
          value={draftInputs.minPrice}
          onChange={(value) => setDraftInputs((current) => ({ ...current, minPrice: value }))}
          placeholder={t("browse.pricePlaceholderMin")}
        />

        <FilterNumberInput
          label={t("browse.maxPrice")}
          value={draftInputs.maxPrice}
          onChange={(value) => setDraftInputs((current) => ({ ...current, maxPrice: value }))}
          placeholder={t("browse.pricePlaceholderMax")}
        />

        <FilterNumberInput
          label={t("browse.minAge")}
          value={draftInputs.minAge}
          onChange={(value) => setDraftInputs((current) => ({ ...current, minAge: value }))}
          placeholder={t("browse.yearsPlaceholder")}
        />

        <FilterNumberInput
          label={t("browse.maxAge")}
          value={draftInputs.maxAge}
          onChange={(value) => setDraftInputs((current) => ({ ...current, maxAge: value }))}
          placeholder={t("browse.yearsPlaceholder")}
        />

        <FilterNumberInput
          label={t("browse.minHeight")}
          value={draftInputs.minHeight}
          onChange={(value) => setDraftInputs((current) => ({ ...current, minHeight: value }))}
          placeholder={t("browse.cmPlaceholder")}
        />

        <FilterNumberInput
          label={t("browse.maxHeight")}
          value={draftInputs.maxHeight}
          onChange={(value) => setDraftInputs((current) => ({ ...current, maxHeight: value }))}
          placeholder={t("browse.cmPlaceholder")}
        />

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 font-semibold transition disabled:opacity-60"
          >
            {isPending ? t("browse.searching") : t("browse.applyFilters")}
          </button>
        </div>
      </form>
    </>
  );
});

function FilterSearchableSelect({
  label,
  value,
  options,
  emptyOption,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: ReturnType<typeof getCountrySelectOptions>;
  emptyOption: { value: string; label: string };
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const inputClassName =
    "w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white outline-none focus:border-blue-500";

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        emptyOption={emptyOption}
        placeholder={placeholder}
        className="mt-2"
        inputClassName={inputClassName}
      />
    </label>
  );
}

function FilterSelect({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  const inputClassName =
    "mt-2 w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white outline-none focus:border-blue-500";

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName}>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterNumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const inputClassName =
    "mt-2 w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white outline-none focus:border-blue-500";

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClassName}
      />
    </label>
  );
}
