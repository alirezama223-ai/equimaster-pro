"use client";

import { SortOption } from "@/app/lib/horse-filters";

type Props = {
  search: string;
  setSearch: (value: string) => void;

  breed: string;
  setBreed: (value: string) => void;
  breeds: string[];

  country: string;
  setCountry: (value: string) => void;
  countries: string[];

  gender: string;
  setGender: (value: string) => void;

  discipline: string;
  setDiscipline: (value: string) => void;
  disciplines: string[];

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
  breeds,
  country,
  setCountry,
  countries,
  gender,
  setGender,
  discipline,
  setDiscipline,
  disciplines,
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
  return (
    <section className="bg-[#08111F] py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="rounded-3xl bg-[#111C2E] border border-gray-800 shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Find Your Perfect Horse
            </h2>
            <p className="mt-3 text-gray-400">
              Search and filter Europe&apos;s finest sport horses.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
                <label className={labelClassName}>Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search horse..."
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Breed</label>
                <select
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className={inputClassName}
                >
                  <option value="All">All Breeds</option>
                  {breeds.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputClassName}
                >
                  <option value="All">All Countries</option>
                  {countries.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={inputClassName}
                >
                  <option value="All">All Genders</option>
                  <option value="Mare">Mare</option>
                  <option value="Stallion">Stallion</option>
                  <option value="Gelding">Gelding</option>
                </select>
              </div>

              <div>
                <label className={labelClassName}>Discipline</label>
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className={inputClassName}
                >
                  <option value="All">All Disciplines</option>
                  {disciplines.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <label className="rounded-xl bg-[#08111F] border border-gray-700 px-5 py-4 flex items-center gap-3 text-white cursor-pointer min-h-[58px] mt-auto">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="w-5 h-5"
                />
                <span>Verified Only</span>
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div>
                <label className={labelClassName}>Min Price (€)</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="e.g. 30000"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Max Price (€)</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="e.g. 60000"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Min Age</label>
                <input
                  type="number"
                  min={0}
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  placeholder="Years"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Max Age</label>
                <input
                  type="number"
                  min={0}
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  placeholder="Years"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Min Height (cm)</label>
                <input
                  type="number"
                  min={0}
                  value={minHeight}
                  onChange={(e) => setMinHeight(e.target.value)}
                  placeholder="cm"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Max Height (cm)</label>
                <input
                  type="number"
                  min={0}
                  value={maxHeight}
                  onChange={(e) => setMaxHeight(e.target.value)}
                  placeholder="cm"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full sm:max-w-sm">
                <label className={labelClassName}>Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className={inputClassName}
                >
                  <option value="default">Default Order</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="age-asc">Age: Youngest First</option>
                  <option value="age-desc">Age: Oldest First</option>
                  <option value="height-asc">Height: Low to High</option>
                  <option value="height-desc">Height: High to Low</option>
                </select>
              </div>

              <button
                type="button"
                onClick={onResetFilters}
                className="w-full sm:w-auto px-6 py-4 rounded-xl border border-blue-500/40 bg-blue-600/10 text-blue-300 font-semibold hover:bg-blue-600 hover:text-white transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
