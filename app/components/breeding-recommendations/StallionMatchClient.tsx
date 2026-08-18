"use client";

import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import {
  runStallionRecommendationSearch,
  searchRecommendationMareCandidates,
} from "@/app/actions/breeding-recommendations";
import { runGoalBasedRecommendationSearch } from "@/app/actions/traits";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import SearchableSelect from "@/app/components/shared/SearchableSelect";
import { getCountrySelectOptions } from "@/app/lib/constants/countries";
import { getDisciplineSelectOptions } from "@/app/lib/constants/disciplines";
import BreedingGoalsPanel from "@/app/components/breeding-goals/BreedingGoalsPanel";
import RecommendationResultCard from "@/app/components/breeding-recommendations/RecommendationResultCard";
import GoalBasedResultCard from "@/app/components/breeding-recommendations/GoalBasedResultCard";
import { GoalBasedRecommendationResponse } from "@/app/lib/breeding-goals/recommendations";
import { formatPedigreeIdentityLine } from "@/app/lib/pedigree";
import {
  detectSingleStudFeeCurrency,
  sortRecommendationResults,
} from "@/app/lib/breeding-recommendations/rank";
import {
  describeActiveStallionRecommendationFilters,
  normalizeStallionRecommendationFilters,
} from "@/app/lib/breeding-recommendations/filters";
import { BreedingCandidate } from "@/app/types/breeding";
import { BREEDING_METHODS } from "@/app/types/stallion";
import { BREEDING_METHOD_I18N_KEY } from "@/app/lib/stallions/breeding-method-i18n";
import {
  MinimumPedigreeConfidenceFilter,
  RecommendationSortOption,
  StallionRecommendationFilters,
  StallionRecommendationResponse,
} from "@/app/types/breeding-recommendations";
import { MareBreedingGoals } from "@/app/types/traits";

const countryOptions = getCountrySelectOptions();
const disciplineOptions = getDisciplineSelectOptions();

type MatchMode = "pedigree" | "goal_based";

export default function StallionMatchClient() {
  const t = useTranslations("breeding");
  const tMethods = useTranslations("stallions.breedingMethods");
  const router = useRouter();
  const [mareQuery, setMareQuery] = useState("");
  const [mareResults, setMareResults] = useState<BreedingCandidate[]>([]);
  const [mare, setMare] = useState<BreedingCandidate | null>(null);
  const [response, setResponse] = useState<StallionRecommendationResponse | null>(null);
  const [goalResponse, setGoalResponse] = useState<GoalBasedRecommendationResponse | null>(null);
  const [matchMode, setMatchMode] = useState<MatchMode>("pedigree");
  const [breedingGoals, setBreedingGoals] = useState<MareBreedingGoals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [sort, setSort] = useState<RecommendationSortOption>("best_match");
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const [filters, setFilters] = useState<StallionRecommendationFilters>({
    discipline: "",
    studbook: "",
    country: "",
    maxStudFee: null,
    studFeeCurrency: "EUR",
    breedingMethods: [],
    includeUnavailable: false,
    minimumPedigreeConfidence: "any",
  });

  const sortedResults = useMemo(() => {
    if (!response) return [];
    const singleCurrency = detectSingleStudFeeCurrency(response.results);
    return sortRecommendationResults(response.results, sort, singleCurrency);
  }, [response, sort]);

  const canSortByStudFee = useMemo(() => {
    if (!response) return false;
    return detectSingleStudFeeCurrency(response.results) !== null;
  }, [response]);

  const activeFilterSummary = useMemo(
    () => describeActiveStallionRecommendationFilters(filters),
    [filters]
  );

  const allBreedingMethodsSelected = useMemo(
    () => BREEDING_METHODS.every((method) => filters.breedingMethods?.includes(method)),
    [filters.breedingMethods]
  );

  const hasBreedingMethodUiSelection = (filters.breedingMethods?.length ?? 0) > 0;

  function handleMareSearch(value: string) {
    setMareQuery(value);
    if (value.trim().length < 2) {
      setMareResults([]);
      return;
    }

    startTransition(async () => {
      try {
        const result = await searchRecommendationMareCandidates({ query: value.trim() });
        setMareResults(result.candidates);
      } catch (cause) {
        setMareResults([]);
        setError(cause instanceof Error ? cause.message : "Mare search failed.");
      }
    });
  }

  function handleSelectMare(candidate: BreedingCandidate) {
    setMare(candidate);
    setMareResults([]);
    setMareQuery("");
    setResponse(null);
    setGoalResponse(null);
    setBreedingGoals(null);
    setSelectedCompareIds([]);
    setError(null);
    setRunStatus(null);
  }

  function handleMatchModeChange(mode: MatchMode) {
    setMatchMode(mode);
    setError(null);
    setRunStatus(null);
    if (mode === "pedigree") {
      setGoalResponse(null);
    } else {
      setResponse(null);
      setSelectedCompareIds([]);
    }
  }

  function toggleBreedingMethod(method: string) {
    setFilters((current) => {
      const methods = current.breedingMethods ?? [];
      const next = methods.includes(method)
        ? methods.filter((item) => item !== method)
        : [...methods, method];
      return { ...current, breedingMethods: next };
    });
  }

  function handleFindMatches() {
    if (!mare) {
      setError(t("recommendations.errorSelectMare"));
      setRunStatus(null);
      return;
    }

    if (matchMode === "goal_based") {
      if (!breedingGoals || (breedingGoals.improveGoals.length === 0 && breedingGoals.preserveTraits.length === 0)) {
        setError(t("recommendations.errorDefineGoals"));
        setRunStatus(null);
        return;
      }
    }

    setError(null);
    setRunStatus(matchMode === "goal_based" ? "Running Goal-Based Match…" : "Running Pedigree Match…");
    startTransition(async () => {
      try {
        const payload = normalizeStallionRecommendationFilters(filters);

        if (matchMode === "goal_based") {
          const result = await runGoalBasedRecommendationSearch({
            marePedigreeId: mare.id,
            goals: {
              ...breedingGoals!,
              marePedigreeId: mare.id,
            },
            filters: payload,
            sort: "best_goal_match",
          });

          if (result.error) {
            setError(result.error);
            setGoalResponse(null);
            setResponse(null);
            setRunStatus(null);
            return;
          }

          if (!result.response) {
            setError("Goal-Based Match returned no response. Please try again.");
            setGoalResponse(null);
            setResponse(null);
            setRunStatus(null);
            return;
          }

          setGoalResponse(result.response);
          setResponse(null);
          setSelectedCompareIds([]);
          setRunStatus(`Goal-Based Match complete — ${result.response.analyzedCount} stallion(s) analyzed.`);
          return;
        }

        const result = await runStallionRecommendationSearch({
          marePedigreeId: mare.id,
          filters: payload,
          sort: "best_match",
        });

        if (result.error) {
          setError(result.error);
          setResponse(null);
          setRunStatus(null);
          return;
        }

        if (!result.response) {
          setError("Pedigree Match returned no response. Please try again.");
          setResponse(null);
          setRunStatus(null);
          return;
        }

        setResponse(result.response);
        setGoalResponse(null);
        setSelectedCompareIds([]);
        setRunStatus(`Pedigree Match complete — ${result.response.analyzedCount} stallion(s) analyzed.`);
      } catch (cause) {
        setGoalResponse(null);
        setResponse(null);
        setRunStatus(null);
        setError(cause instanceof Error ? cause.message : "Match request failed unexpectedly.");
      }
    });
  }

  function toggleCompareSelection(pedigreeHorseId: string) {
    setSelectedCompareIds((current) => {
      if (current.includes(pedigreeHorseId)) {
        return current.filter((id) => id !== pedigreeHorseId);
      }
      if (current.length >= 3) return current;
      return [...current, pedigreeHorseId];
    });
  }

  function handleCompareSelected() {
    if (!mare || selectedCompareIds.length < 2) return;
    const [primary, ...rest] = selectedCompareIds;
    const params = new URLSearchParams({
      mare: mare.id,
      stallion: primary,
    });
    if (rest.length > 0) {
      params.set("compare", rest.join(","));
    }
    router.push(`/breeding-lab?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("recommendations.eyebrow")}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black text-white">{t("recommendations.title")}</h1>
        <p className="mt-3 max-w-3xl text-gray-400">
          {matchMode === "pedigree"
            ? t("recommendations.subtitlePedigree")
            : t("recommendations.subtitleGoal")}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-3" role="tablist" aria-label={t("recommendations.modeLabel")}>
          <button
            type="button"
            role="tab"
            aria-selected={matchMode === "pedigree"}
            onClick={() => handleMatchModeChange("pedigree")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${matchMode === "pedigree" ? "bg-blue-600 text-white ring-2 ring-blue-400/50" : "border border-white/10 text-gray-300 hover:border-white/20"}`}
          >
            {t("recommendations.pedigreeMatch")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={matchMode === "goal_based"}
            onClick={() => handleMatchModeChange("goal_based")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${matchMode === "goal_based" ? "bg-emerald-600 text-white ring-2 ring-emerald-400/50" : "border border-white/10 text-gray-300 hover:border-white/20"}`}
          >
            {t("recommendations.goalBasedMatch")}
          </button>
        </div>
        {matchMode === "goal_based" ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">{t("recommendations.goalBasedActive")}</div>
        ) : null}
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{t("recommendations.step1")}</p>
        <h2 className="mt-2 text-2xl font-bold text-white">{t("recommendations.selectMare")}</h2>
        <p className="mt-2 text-sm text-gray-400">{t("recommendations.selectMareHint")}</p>
        <input type="text" value={mareQuery} onChange={(event) => handleMareSearch(event.target.value)} placeholder={t("recommendations.searchMaresPlaceholder")} className="mt-5 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" />
        {mareResults.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {mareResults.map((candidate) => (
              <li key={candidate.id}>
                <button type="button" onClick={() => handleSelectMare(candidate)} className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-left hover:border-blue-500/40 transition">
                  <p className="font-semibold text-white">{candidate.name}</p>
                  <p className="mt-1 text-sm text-gray-400">{formatPedigreeIdentityLine({ name: candidate.name, birthYear: candidate.birthYear, sex: candidate.sex, studbook: candidate.studbook, sireName: candidate.sireName, damSireName: candidate.damSireName })}</p>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {mare ? (
          <div className="mt-5 rounded-2xl border border-blue-500/30 bg-[#08111F] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2"><p className="text-lg font-bold text-white">{mare.name}</p>{mare.verified ? <VerifiedBadge /> : null}</div>
                <p className="mt-2 text-sm text-gray-400">{formatPedigreeIdentityLine({ name: mare.name, birthYear: mare.birthYear, sex: mare.sex, studbook: mare.studbook, sireName: mare.sireName, damSireName: mare.damSireName })}</p>
                {mare.registrationNumber ? <p className="mt-1 text-xs text-gray-500">{t("recommendations.registration", { number: mare.registrationNumber })}</p> : null}
              </div>
              <button type="button" onClick={() => { setMare(null); setResponse(null); setGoalResponse(null); setBreedingGoals(null); setRunStatus(null); }} className="text-sm text-gray-400 hover:text-white">{t("clear")}</button>
            </div>
            <Link href={`/pedigree/${mare.id}`} className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300">{t("recommendations.viewPedigreeProfile")}</Link>
          </div>
        ) : null}
      </section>

      {matchMode === "goal_based" ? (
        <div className="space-y-3">
          <div><p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{t("recommendations.step2")}</p><h2 className="mt-2 text-2xl font-bold text-white">{t("recommendations.defineGoals")}</h2></div>
          <BreedingGoalsPanel key={mare?.id ?? "no-mare"} marePedigreeId={mare?.id ?? null} onGoalsChange={setBreedingGoals} />
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{matchMode === "goal_based" ? t("recommendations.step3") : t("recommendations.step2")}</p>
        <h2 className="mt-2 text-2xl font-bold text-white">{t("recommendations.preferencesFilters")}</h2>
        <p className="mt-2 text-sm text-gray-400">{t("recommendations.filtersHint")}</p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#08111F] p-4"><p className="text-xs uppercase tracking-[0.15em] text-gray-500">{t("recommendations.activeFilters")}</p><ul className="mt-2 space-y-1 text-sm text-gray-300">{activeFilterSummary.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block text-sm text-gray-300">{t("recommendations.discipline")}<div className="mt-2"><SearchableSelect value={filters.discipline ?? ""} onChange={(value) => setFilters((current) => ({ ...current, discipline: value || undefined }))} options={disciplineOptions} placeholder={t("recommendations.anyDiscipline")} inputClassName="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" /></div></label>
          <label className="block text-sm text-gray-300">{t("recommendations.studbook")}<input type="text" value={filters.studbook ?? ""} onChange={(event) => setFilters((current) => ({ ...current, studbook: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" placeholder={t("recommendations.anyStudbook")} /></label>
          <label className="block text-sm text-gray-300">{t("recommendations.country")}<div className="mt-2"><SearchableSelect value={filters.country ?? ""} onChange={(value) => setFilters((current) => ({ ...current, country: value || undefined }))} options={countryOptions} placeholder={t("recommendations.anyCountry")} inputClassName="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" /></div></label>
          <label className="block text-sm text-gray-300">{t("recommendations.maxStudFee")}<input type="number" min={0} value={filters.maxStudFee ?? ""} onChange={(event) => setFilters((current) => ({ ...current, maxStudFee: event.target.value ? Number(event.target.value) : null }))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" placeholder={t("recommendations.optional")} /></label>
          <label className="block text-sm text-gray-300">{t("recommendations.studFeeCurrency")}<select value={filters.studFeeCurrency ?? "EUR"} onChange={(event) => setFilters((current) => ({ ...current, studFeeCurrency: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></label>
          <label className="block text-sm text-gray-300">{t("recommendations.minPedigreeConfidence")}<select value={filters.minimumPedigreeConfidence ?? "any"} onChange={(event) => setFilters((current) => ({ ...current, minimumPedigreeConfidence: event.target.value as MinimumPedigreeConfidenceFilter }))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"><option value="any">{t("recommendations.any")}</option><option value="moderate">{t("recommendations.moderatePlus")}</option><option value="high">{t("recommendations.highOnly")}</option></select></label>
        </div>
        <div className="mt-5"><p className="text-sm text-gray-300">{t("recommendations.breedingMethod")}</p><p className="mt-1 text-xs text-gray-500">{t("recommendations.breedingMethodHint")}</p>{allBreedingMethodsSelected ? <p className="mt-2 text-xs text-emerald-300">{t("recommendations.allMethodsSelected")}</p> : hasBreedingMethodUiSelection ? <p className="mt-2 text-xs text-amber-200">{t("recommendations.restrictingMethods")}</p> : <p className="mt-2 text-xs text-gray-500">{t("recommendations.anyBreedingMethod")}</p>}<div className="mt-3 flex flex-wrap gap-3">{BREEDING_METHODS.map((method) => <label key={method} className="inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={filters.breedingMethods?.includes(method) ?? false} onChange={() => toggleBreedingMethod(method)} className="rounded border-white/20 bg-[#08111F]" />{tMethods(BREEDING_METHOD_I18N_KEY[method])}</label>)}</div></div>
        <label className="mt-5 inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={Boolean(filters.includeUnavailable)} onChange={(event) => setFilters((current) => ({ ...current, includeUnavailable: event.target.checked }))} className="rounded border-white/20 bg-[#08111F]" />{t("recommendations.includeUnavailable")}</label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{matchMode === "goal_based" ? t("recommendations.step4") : t("recommendations.step3")}</p>
        <h2 className="mt-2 text-2xl font-bold text-white">{matchMode === "goal_based" ? t("recommendations.findGoalMatches") : t("recommendations.findStallionMatches")}</h2>
        {matchMode === "goal_based" ? <p className="mt-2 text-sm text-gray-400">{t("recommendations.goalMatchRequiresGoals")}</p> : null}
        <button type="button" onClick={handleFindMatches} disabled={pending || !mare} className={`mt-5 rounded-xl px-6 py-3 font-semibold text-white transition disabled:opacity-50 ${matchMode === "goal_based" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"}`}>
          {pending ? (matchMode === "goal_based" ? t("recommendations.analyzingGoals") : t("recommendations.analyzingPedigree")) : (matchMode === "goal_based" ? t("recommendations.findGoalMatches") : t("recommendations.findStallionMatches"))}
        </button>
        {runStatus ? <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-950/20 px-4 py-3 text-sm text-blue-100">{runStatus}</div> : null}
        {error ? <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      </section>

      {goalResponse ? (
        <section className="space-y-5"><div><h2 className="text-3xl font-bold text-white">{t("recommendations.goalResultsTitle")}</h2><p className="mt-2 text-sm text-gray-400">{t("recommendations.goalResultsSubtitle")}</p><p className="mt-2 text-sm text-gray-500">{t("recommendations.analyzedCount", { count: goalResponse.analyzedCount })}{goalResponse.eligiblePoolCount > goalResponse.analyzedCount ? ` (from ${goalResponse.eligiblePoolCount} matching filters; top ${goalResponse.analyzedCount} evaluated)` : goalResponse.eligiblePoolCount > 0 ? ` (from ${goalResponse.eligiblePoolCount} matching filters)` : ""}</p></div>{goalResponse.results.length === 0 ? <div className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-8"><p className="text-lg font-semibold text-amber-100">{t("recommendations.noGoalResultsTitle")}</p><p className="mt-2 text-sm text-amber-50/90">{goalResponse.emptyResultsReason ?? "No eligible active stallions with pedigree linkage matched the current mare and filters."}</p><p className="mt-3 text-xs text-amber-100/80">{t("recommendations.noGoalResultsHint")}</p></div> : goalResponse.results.map((result) => <GoalBasedResultCard key={result.pedigreeHorseId} result={result} marePedigreeId={mare!.id} />)}<p className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-xs text-gray-400">{goalResponse.disclaimer}</p></section>
      ) : null}

      {response ? (
        <section className="space-y-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-3xl font-bold text-white">{t("recommendations.recommendedTitle")}</h2><p className="mt-2 text-sm text-gray-400">{t("recommendations.analyzedCount", { count: response.analyzedCount })}{response.eligiblePoolCount > response.analyzedCount ? ` (from ${response.eligiblePoolCount} matching filters; top ${response.analyzedCount} evaluated)` : ""}</p></div><div className="flex flex-wrap items-center gap-3"><label className="text-sm text-gray-300">{t("recommendations.sort")}<select value={sort} onChange={(event) => setSort(event.target.value as RecommendationSortOption)} className="ml-2 rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-white"><option value="best_match">{t("recommendations.sortBestMatch")}</option><option value="highest_confidence">{t("recommendations.sortHighestConfidence")}</option>{canSortByStudFee ? <option value="lowest_stud_fee">{t("recommendations.sortLowestStudFee")}</option> : null}<option value="name">{t("recommendations.sortName")}</option></select></label>{selectedCompareIds.length >= 2 ? <button type="button" onClick={handleCompareSelected} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition">{t("recommendations.compareSelected", { count: selectedCompareIds.length })}</button> : null}</div></div>{sortedResults.length === 0 ? <div className="rounded-3xl border border-white/10 bg-[#111827] p-8 text-center"><p className="text-lg font-semibold text-white">{t("recommendations.noEligibleStallions")}</p><p className="mt-2 text-sm text-gray-400">{t("recommendations.tryRemovingFilters")}</p></div> : sortedResults.map((result) => <RecommendationResultCard key={result.candidate.pedigreeHorseId} result={result} marePedigreeId={mare!.id} selected={selectedCompareIds.includes(result.candidate.pedigreeHorseId)} onToggleSelect={toggleCompareSelection} compareDisabled={selectedCompareIds.length >= 3} />)}<p className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-xs text-gray-400">{response.disclaimer}</p></section>
      ) : null}
    </div>
  );
}
