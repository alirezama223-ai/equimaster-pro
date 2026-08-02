"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { searchBloodlines } from "@/app/actions/pedigree";
import PedigreeHorseCardClient from "@/app/components/pedigree/PedigreeHorseCardClient";
import { PedigreeSearchResult } from "@/app/types/pedigree";

type Props = {
  initialResults: PedigreeSearchResult[];
  initialQuery: string;
  initialStudbook: string;
  initialRegistrationNumber: string;
};

export default function BloodlinesSearchClient({
  initialResults,
  initialQuery,
  initialStudbook,
  initialRegistrationNumber,
}: Props) {
  const t = useTranslations("bloodlines");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState(initialResults);
  const [query, setQuery] = useState(initialQuery);
  const [studbook, setStudbook] = useState(initialStudbook);
  const [registrationNumber, setRegistrationNumber] = useState(initialRegistrationNumber);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (studbook.trim()) params.set("studbook", studbook.trim());
    if (registrationNumber.trim()) params.set("ueln", registrationNumber.trim());

    startTransition(async () => {
      router.replace(params.toString() ? `/bloodlines?${params.toString()}` : "/bloodlines");
      const response = await searchBloodlines({
        query: query.trim(),
        studbook: studbook.trim(),
        registrationNumber: registrationNumber.trim(),
      });
      setResults(response.results);
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#111827] p-6 grid gap-4 md:grid-cols-2">
        <Field label={t("search.horseNameLabel")} value={query} onChange={setQuery} placeholder={t("search.horseNamePlaceholder")} />
        <Field label={t("search.studbookLabel")} value={studbook} onChange={setStudbook} placeholder={t("search.studbookPlaceholder")} />
        <Field
          label={t("search.registrationLabel")}
          value={registrationNumber}
          onChange={setRegistrationNumber}
          placeholder={t("search.registrationPlaceholder")}
        />
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {pending ? t("search.searching") : t("search.submit")}
          </button>
        </div>
      </form>

      {results.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">
          {searchParams.toString()
            ? t("search.emptyWithQuery")
            : t("search.emptyInitial")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((result) => (
            <PedigreeHorseCardClient key={result.id} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
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
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-300">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
      />
    </label>
  );
}
