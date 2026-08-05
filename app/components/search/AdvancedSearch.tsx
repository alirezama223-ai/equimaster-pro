"use client";

import { useTranslations } from "next-intl";
import SearchableSelect from "@/app/components/shared/SearchableSelect";
import { getBreedSelectOptions } from "@/app/lib/breeds";
import { getCountrySelectOptions } from "@/app/lib/constants/countries";
import { getDisciplineSelectOptions } from "@/app/lib/constants/disciplines";
import { SortOption } from "@/app/lib/horse-filters";

const countryOptions = getCountrySelectOptions();
const disciplineOptions = getDisciplineSelectOptions();
const breedOptions = getBreedSelectOptions();

type Props = {
  search: string;
  setSearch: (value: string) => void;

  breed: string;
  setBreed: (value: string) => void;

  country: string;
  setCountry: (value: string) => void;

  gender: string;
  setGender: (value: string) => void;

  discipline: string;
  setDiscipline: (value: string) => void;

  verified: boolean;
  setVerified: (value: boolean) => void;

  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;

  minAge: string;
  setMinAge: (value: string) => void;
  maxAge: string;
  setMaxAge: (value: string) => void;

  minHeight: string;
  setMinHeight: (value: string) => void;
  maxHeight: string;
  setMaxHeight: (value: string) => void;

  sort: SortOption;
  setSort: (value: SortOption) => void;

  onResetFilters: () => void;
};

const inputClassName =
  "w-full rounded-xl bg-[#08111F] border border-gray-700 px-5 py-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition";

const labelClassName = "mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400";

export default function AdvancedSearch({
  search,
  setSearch,
  breed,
  setBreed,
  country,
  setCountry,
  gender,
  setGender,
  discipline,
  setDiscipline,
  verified,
  setVerified,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  minAge,
  setMinAge,
  maxAge,
  setMaxAge,
  minHeight,
  setMinHeight,
  maxHeight,
  setMaxHeight,
  sort,
  setSort,
  onResetFilters,
}: Props) {
  const t = useTranslations("home");

  return (
    <section className="bg-[#08111F] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-[#111C2E] border border-gray-800 shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {t("search.title")}
            </h2>
            <p className="mt-3 text-gray-400">{t("search.subtitle")}</p>
          </div>

          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
                <label className={labelClassName}>{t("search.queryLabel")}</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search.queryPlaceholder")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("search.breed")}</label>
                <SearchableSelect
                  value={breed}
                  onChange={setBreed}
                  options={breedOptions}
                  emptyOption={{ value: "All", label: t("search.allBreeds") }}
                  placeholder={t("search.allBreedsPlaceholder")}
                  inputClassName={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("search.country")}</label>
                <SearchableSelect
                  value={country}
                  onChange={setCountry}
                  options={countryOptions}
                  emptyOption={{ value: "All", label: t("search.allCountries") }}
                  placeholder={t("search.allCountriesPlaceholder")}
                  inputClassName={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("search.gender")}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={inputClassName}
                >
                  <option value="All">{t("search.allGenders")}</option>
                  <option value="Mare">{t("search.mare")}</option>
                  <option value="Stallion">{t("search.stallion")}</option>
                  <option value="Gelding">{t("search.gelding")}</option>
                </select>
              </div>

              <div>
                <label className={labelClassName}>{t("search.discipline")}</label>
                <SearchableSelect
                  value={discipline}
                  onChange={setDiscipline}
                  options={disciplineOptions}
                  emptyOption={{ value: "All", label: t("search.allDisciplines") }}
                  placeholder={t("search.allDisciplinesPlaceholder")}
                  inputClassName={inputClassName}
                />
              </div>

              <label className="rounded-xl bg-[#08111F] border border-gray-700 px-5 py-4 flex items-center gap-3 text-white cursor-pointer min-h-[58px] mt-auto">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="w-5 h-5"
                />
                <span>{t("search.verifiedOnly")}</span>
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div>
                <label className={labelClassName}>{t("search.minPrice")}</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder={t("search.pricePlaceholderMin")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("search.maxPrice")}</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder={t("search.pricePlaceholderMax")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("search.minAge")}</label>
                <input
                  type="number"
                  min={0}
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  placeholder={t("search.yearsPlaceholder")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("search.maxAge")}</label>
                <input
                  type="number"
                  min={0}
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  placeholder={t("search.yearsPlaceholder")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("search.minHeight")}</label>
                <input
                  type="number"
                  min={0}
                  value={minHeight}
                  onChange={(e) => setMinHeight(e.target.value)}
                  placeholder={t("search.cmPlaceholder")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("search.maxHeight")}</label>
                <input
                  type="number"
                  min={0}
                  value={maxHeight}
                  onChange={(e) => setMaxHeight(e.target.value)}
                  placeholder={t("search.cmPlaceholder")}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full sm:max-w-sm">
                <label className={labelClassName}>{t("search.sortBy")}</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className={inputClassName}
                >
                  <option value="default">{t("search.sortDefault")}</option>
                  <option value="price-asc">{t("search.sortPriceAsc")}</option>
                  <option value="price-desc">{t("search.sortPriceDesc")}</option>
                  <option value="age-asc">{t("search.sortAgeAsc")}</option>
                  <option value="age-desc">{t("search.sortAgeDesc")}</option>
                  <option value="height-asc">{t("search.sortHeightAsc")}</option>
                  <option value="height-desc">{t("search.sortHeightDesc")}</option>
                </select>
              </div>

              <button
                type="button"
                onClick={onResetFilters}
                className="w-full sm:w-auto px-6 py-4 rounded-xl border border-blue-500/40 bg-blue-600/10 text-blue-300 font-semibold hover:bg-blue-600 hover:text-white transition"
              >
                {t("search.resetFilters")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
