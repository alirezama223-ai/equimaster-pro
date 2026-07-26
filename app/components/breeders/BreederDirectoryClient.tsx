"use client";

import { useMemo, useState } from "react";
import Navbar from "@/app/components/navbar/Navbar";
import BreederCard from "@/app/components/breeders/BreederCard";
import FadeUp from "@/app/components/animations/FadeUp";
import { BreederCardData } from "@/app/types/breeder";

type Props = {
  breeders: BreederCardData[];
  loadError?: string;
};

export default function BreederDirectoryClient({ breeders, loadError }: Props) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const [discipline, setDiscipline] = useState("All");

  const countries = useMemo(
    () => [...new Set(breeders.map((b) => b.country).filter(Boolean))].sort(),
    [breeders]
  );

  const disciplines = useMemo(
    () =>
      [...new Set(breeders.flatMap((b) => b.disciplines).filter(Boolean))].sort(),
    [breeders]
  );

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
                  Breeder & Stud Farm Directory
                </h1>
                <p className="mt-3 text-gray-400">
                  Discover professional breeders and stud farms across Europe.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Search
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Stud farm name, location..."
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Country
                  </label>
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
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Discipline
                  </label>
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
              </div>

              <p className="mt-6 text-gray-400">
                Showing <span className="text-white font-semibold">{filtered.length}</span> stud
                farm{filtered.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-24">
          {loadError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200 mb-8">
              Unable to load breeders: {loadError}
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <FadeUp>
              <div className="rounded-3xl border border-white/10 bg-[#111827] px-8 py-16 text-center">
                <h3 className="text-2xl font-bold text-white">No stud farms found</h3>
                <p className="mt-3 text-gray-400 max-w-xl mx-auto">
                  {breeders.length === 0
                    ? "The breeder directory is ready. Create your stud farm profile from your account to get started."
                    : "Try adjusting your search to find more breeders."}
                </p>
              </div>
            </FadeUp>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filtered.map((breeder) => (
                <FadeUp key={breeder.id}>
                  <BreederCard breeder={breeder} />
                </FadeUp>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
