"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import Navbar from "@/app/components/navbar/Navbar";
import BreederCardClient from "@/app/components/breeders/BreederCardClient";
import SearchableSelect from "@/app/components/shared/SearchableSelect";
import FadeUp from "@/app/components/animations/FadeUp";
import { getCountrySelectOptions } from "@/app/lib/constants/countries";
import { getDisciplineSelectOptions } from "@/app/lib/constants/disciplines";
import { BreederCardData } from "@/app/types/breeder";

const countryOptions = getCountrySelectOptions();
const disciplineOptions = getDisciplineSelectOptions();

type Props = {
  breeders: BreederCardData[];
  loadError?: string;
};

export default function BreederDirectoryClient({ breeders, loadError }: Props) {
  const t = useTranslations("breeders");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const [discipline, setDiscipline] = useState("All");

  const filtered = useMemo(() => {
    return breeders.filter((breeder) => {
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const haystack = [breeder.name, breeder.country, breeder.city ?? "", breeder.description]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (country !== "All" && breeder.country !== country) return false;
      if (discipline !== "All" && !breeder.disciplines.includes(discipline)) return false;
      return true;
    });
  }, [breeders, search, country, discipline]);

  const inputClassName =
    "w-full rounded-xl bg-[#08111F] border border-gray-700 px-5 py-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] pt-20">
        <section className="bg-[#08111F] py-14">
          <div className="max-w-7xl mx-auto px-6">
            <div className="rounded-3xl bg-[#111C2E] border border-gray-800 shadow-2xl p-6 sm:p-8">
              <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  {t("directory.title")}
                </h1>
                <p className="mt-3 text-gray-400">
                  {t("directory.subtitle")}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {t("directory.searchLabel")}
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("directory.searchPlaceholder")}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {t("directory.countryLabel")}
                  </label>
                  <SearchableSelect
                    value={country}
                    onChange={setCountry}
                    options={countryOptions}
                    emptyOption={{ value: "All", label: t("directory.allCountries") }}
                    placeholder={t("directory.allCountriesPlaceholder")}
                    inputClassName={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {t("directory.disciplineLabel")}
                  </label>
                  <SearchableSelect
                    value={discipline}
                    onChange={setDiscipline}
                    options={disciplineOptions}
                    emptyOption={{ value: "All", label: t("directory.allDisciplines") }}
                    placeholder={t("directory.allDisciplinesPlaceholder")}
                    inputClassName={inputClassName}
                  />
                </div>
              </div>

              <p className="mt-6 text-gray-400">
                {t("directory.showingCount", { count: filtered.length })}
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-24">
          {loadError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200 mb-8">
              {t("directory.loadError", { error: loadError })}
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <FadeUp>
              <div className="rounded-3xl border border-white/10 bg-[#111827] px-8 py-16 text-center">
                <h3 className="text-2xl font-bold text-white">{t("directory.emptyTitle")}</h3>
                <p className="mt-3 text-gray-400 max-w-xl mx-auto">
                  {breeders.length === 0
                    ? t("directory.emptyNoData")
                    : t("directory.emptyFiltered")}
                </p>
              </div>
            </FadeUp>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filtered.map((breeder) => (
                <FadeUp key={breeder.id}>
                  <BreederCardClient breeder={breeder} />
                </FadeUp>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
