"use client";

import { useCallback, useMemo, useState } from "react";
import Navbar from "@/app/components/navbar/Navbar";
import StallionCard from "@/app/components/stallions/StallionCard";
import StallionFilters from "@/app/components/stallions/StallionFilters";
import FadeUp from "@/app/components/animations/FadeUp";
import { filterStallionCards, StallionFilterState } from "@/app/lib/stallions";
import { StallionCardData } from "@/app/types/stallion";

const INITIAL_FILTERS: StallionFilterState = {
  search: "",
  breed: "All",
  discipline: "All",
  country: "All",
  availability: "All",
  sire: "",
  damSire: "",
  minStudFee: "",
  maxStudFee: "",
  minBirthYear: "",
  maxBirthYear: "",
};

type Props = {
  stallions: StallionCardData[];
  loadError?: string;
};

export default function StallionDirectoryClient({ stallions, loadError }: Props) {
  const [filters, setFilters] = useState<StallionFilterState>(INITIAL_FILTERS);

  const breeds = useMemo(
    () => [...new Set(stallions.map((s) => s.breed).filter(Boolean))].sort(),
    [stallions]
  );
  const disciplines = useMemo(
    () => [...new Set(stallions.map((s) => s.discipline).filter(Boolean))].sort(),
    [stallions]
  );
  const countries = useMemo(
    () => [...new Set(stallions.map((s) => s.country).filter(Boolean))].sort(),
    [stallions]
  );

  const filtered = useMemo(
    () => filterStallionCards(stallions, filters),
    [stallions, filters]
  );

  const onChange = useCallback(
    <K extends keyof StallionFilterState>(key: K, value: StallionFilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const onReset = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] pt-20">
        <StallionFilters
          filters={filters}
          breeds={breeds}
          disciplines={disciplines}
          countries={countries}
          onChange={onChange}
          onReset={onReset}
          resultCount={filtered.length}
        />

        <section className="max-w-7xl mx-auto px-6 pb-24">
          {loadError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200 mb-8">
              Unable to load stallions: {loadError}
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <FadeUp>
              <div className="rounded-3xl border border-white/10 bg-[#111827] px-8 py-16 text-center">
                <h3 className="text-2xl font-bold text-white">No stallions found</h3>
                <p className="mt-3 text-gray-400 max-w-xl mx-auto">
                  {stallions.length === 0
                    ? "The stallion directory is ready. Stud farms can add stallions from their account once profiles are created."
                    : "Try adjusting your filters to discover more breeding stallions."}
                </p>
              </div>
            </FadeUp>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filtered.map((stallion) => (
                <FadeUp key={stallion.id}>
                  <StallionCard stallion={stallion} />
                </FadeUp>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
