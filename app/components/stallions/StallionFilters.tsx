"use client";

import { useTranslations } from "next-intl";
import SearchableSelect from "@/app/components/shared/SearchableSelect";
import { getBreedSelectOptions } from "@/app/lib/breeds";
import { getCountrySelectOptions } from "@/app/lib/constants/countries";
import { getDisciplineSelectOptions } from "@/app/lib/constants/disciplines";
import { StallionFilterState } from "@/app/lib/stallions";
import { StallionAvailability } from "@/app/types/stallion";

const countryOptions = getCountrySelectOptions();
const disciplineOptions = getDisciplineSelectOptions();
const breedOptions = getBreedSelectOptions();

type Props = {
  filters: StallionFilterState;
  onChange: <K extends keyof StallionFilterState>(key: K, value: StallionFilterState[K]) => void;
  onReset: () => void;
  resultCount: number;
};

const inputClassName =
  "w-full rounded-xl bg-[#08111F] border border-gray-700 px-5 py-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition";

const labelClassName = "mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400";

export default function StallionFilters({
  filters,
  onChange,
  onReset,
  resultCount,
}: Props) {
  const t = useTranslations("stallions");
  const availabilityKeys = ["available", "limited", "booked", "retired"] as StallionAvailability[];

  return (
    <section className="bg-[#08111F] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-[#111C2E] border border-gray-800 shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t("directory.title")}</h2>
            <p className="mt-3 text-gray-400">
              {t("directory.subtitle")}
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="sm:col-span-2">
                <label className={labelClassName}>{t("directory.searchLabel")}</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => onChange("search", e.target.value)}
                  placeholder={t("directory.searchPlaceholder")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("directory.breedLabel")}</label>
                <SearchableSelect
                  value={filters.breed}
                  onChange={(value) => onChange("breed", value)}
                  options={breedOptions}
                  emptyOption={{ value: "All", label: t("directory.allBreeds") }}
                  placeholder={t("directory.allBreedsPlaceholder")}
                  inputClassName={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("directory.disciplineLabel")}</label>
                <SearchableSelect
                  value={filters.discipline}
                  onChange={(value) => onChange("discipline", value)}
                  options={disciplineOptions}
                  emptyOption={{ value: "All", label: t("directory.allDisciplines") }}
                  placeholder={t("directory.allDisciplinesPlaceholder")}
                  inputClassName={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("directory.countryLabel")}</label>
                <SearchableSelect
                  value={filters.country}
                  onChange={(value) => onChange("country", value)}
                  options={countryOptions}
                  emptyOption={{ value: "All", label: t("directory.allCountries") }}
                  placeholder={t("directory.allCountriesPlaceholder")}
                  inputClassName={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("directory.availabilityLabel")}</label>
                <select
                  value={filters.availability}
                  onChange={(e) => onChange("availability", e.target.value)}
                  className={inputClassName}
                >
                  <option value="All">{t("directory.allStatuses")}</option>
                  {availabilityKeys.map((key) => (
                    <option key={key} value={key}>
                      {t(`availability.${key}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>{t("directory.sireLabel")}</label>
                <input
                  type="text"
                  value={filters.sire}
                  onChange={(e) => onChange("sire", e.target.value)}
                  placeholder={t("directory.sirePlaceholder")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("directory.damSireLabel")}</label>
                <input
                  type="text"
                  value={filters.damSire}
                  onChange={(e) => onChange("damSire", e.target.value)}
                  placeholder={t("directory.damSirePlaceholder")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("directory.minStudFeeLabel")}</label>
                <input
                  type="number"
                  min="0"
                  value={filters.minStudFee}
                  onChange={(e) => onChange("minStudFee", e.target.value)}
                  placeholder={t("directory.studFeeExampleLow")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("directory.maxStudFeeLabel")}</label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxStudFee}
                  onChange={(e) => onChange("maxStudFee", e.target.value)}
                  placeholder={t("directory.studFeeExampleHigh")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("directory.birthYearFromLabel")}</label>
                <input
                  type="number"
                  value={filters.minBirthYear}
                  onChange={(e) => onChange("minBirthYear", e.target.value)}
                  placeholder={t("directory.birthYearExampleOld")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{t("directory.birthYearToLabel")}</label>
                <input
                  type="number"
                  value={filters.maxBirthYear}
                  onChange={(e) => onChange("maxBirthYear", e.target.value)}
                  placeholder={t("directory.birthYearExampleYoung")}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <p className="text-gray-400">
                {t("directory.showingCount", { count: resultCount })}
              </p>
              <button
                type="button"
                onClick={onReset}
                className="rounded-xl border border-gray-700 px-6 py-3 text-white font-semibold hover:border-blue-500 hover:text-blue-400 transition"
              >
                {t("directory.resetFilters")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
