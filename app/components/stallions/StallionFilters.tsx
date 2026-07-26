"use client";

import { StallionFilterState } from "@/app/lib/stallions";
import { STALLION_AVAILABILITY_LABELS, StallionAvailability } from "@/app/types/stallion";

type Props = {
  filters: StallionFilterState;
  breeds: string[];
  disciplines: string[];
  countries: string[];
  onChange: <K extends keyof StallionFilterState>(key: K, value: StallionFilterState[K]) => void;
  onReset: () => void;
  resultCount: number;
};

const inputClassName =
  "w-full rounded-xl bg-[#08111F] border border-gray-700 px-5 py-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition";

const labelClassName = "mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400";

export default function StallionFilters({
  filters,
  breeds,
  disciplines,
  countries,
  onChange,
  onReset,
  resultCount,
}: Props) {
  return (
    <section className="bg-[#08111F] py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="rounded-3xl bg-[#111C2E] border border-gray-800 shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Stallion Directory</h2>
            <p className="mt-3 text-gray-400">
              Search elite breeding stallions by pedigree, discipline, and stud fee.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="sm:col-span-2">
                <label className={labelClassName}>Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => onChange("search", e.target.value)}
                  placeholder="Stallion name, sire, dam sire..."
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Breed / Studbook</label>
                <select
                  value={filters.breed}
                  onChange={(e) => onChange("breed", e.target.value)}
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
                <label className={labelClassName}>Discipline</label>
                <select
                  value={filters.discipline}
                  onChange={(e) => onChange("discipline", e.target.value)}
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

              <div>
                <label className={labelClassName}>Country</label>
                <select
                  value={filters.country}
                  onChange={(e) => onChange("country", e.target.value)}
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
                <label className={labelClassName}>Availability</label>
                <select
                  value={filters.availability}
                  onChange={(e) => onChange("availability", e.target.value)}
                  className={inputClassName}
                >
                  <option value="All">All Statuses</option>
                  {(Object.keys(STALLION_AVAILABILITY_LABELS) as StallionAvailability[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {STALLION_AVAILABILITY_LABELS[key]}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className={labelClassName}>Sire</label>
                <input
                  type="text"
                  value={filters.sire}
                  onChange={(e) => onChange("sire", e.target.value)}
                  placeholder="Sire name"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Dam Sire</label>
                <input
                  type="text"
                  value={filters.damSire}
                  onChange={(e) => onChange("damSire", e.target.value)}
                  placeholder="Dam sire name"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Min Stud Fee</label>
                <input
                  type="number"
                  min="0"
                  value={filters.minStudFee}
                  onChange={(e) => onChange("minStudFee", e.target.value)}
                  placeholder="e.g. 1000"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Max Stud Fee</label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxStudFee}
                  onChange={(e) => onChange("maxStudFee", e.target.value)}
                  placeholder="e.g. 5000"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Birth Year From</label>
                <input
                  type="number"
                  value={filters.minBirthYear}
                  onChange={(e) => onChange("minBirthYear", e.target.value)}
                  placeholder="e.g. 2005"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Birth Year To</label>
                <input
                  type="number"
                  value={filters.maxBirthYear}
                  onChange={(e) => onChange("maxBirthYear", e.target.value)}
                  placeholder="e.g. 2018"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <p className="text-gray-400">
                Showing{" "}
                <span className="text-white font-semibold">{resultCount}</span> stallion
                {resultCount === 1 ? "" : "s"}
              </p>
              <button
                type="button"
                onClick={onReset}
                className="rounded-xl border border-gray-700 px-6 py-3 text-white font-semibold hover:border-blue-500 hover:text-blue-400 transition"
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
