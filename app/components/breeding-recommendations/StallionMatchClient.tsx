"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  runStallionRecommendationSearch,
  searchRecommendationMareCandidates,
} from "@/app/actions/breeding-recommendations";
import { runGoalBasedRecommendationSearch } from "@/app/actions/traits";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
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
import {
  MinimumPedigreeConfidenceFilter,
  RecommendationSortOption,
  StallionRecommendationFilters,
  StallionRecommendationResponse,
} from "@/app/types/breeding-recommendations";
import { MareBreedingGoals } from "@/app/types/traits";

type MatchMode = "pedigree" | "goal_based";

export default function StallionMatchClient() {
  const router = useRouter();
  const [mareQuery, setMareQuery] = useState("");
  const [mareResults, setMareResults] = useState<BreedingCandidate[]>([]);
  const [mare, setMare] = useState<BreedingCandidate | null>(null);
  const [response, setResponse] = useState<StallionRecommendationResponse | null>(null);
  const [goalResponse, setGoalResponse] = useState<GoalBasedRecommendationResponse | null>(null);
  const [matchMode, setMatchMode] = useState<MatchMode>("pedigree");
  const [breedingGoals, setBreedingGoals] = useState<MareBreedingGoals | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      const result = await searchRecommendationMareCandidates({ query: value.trim() });
      setMareResults(result.candidates);
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
  }

  function handleMatchModeChange(mode: MatchMode) {
    setMatchMode(mode);
    setError(null);
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
      setError("Select a mare before finding stallion matches.");
      return;
    }

    if (matchMode === "goal_based") {
      if (!breedingGoals || (breedingGoals.improveGoals.length === 0 && breedingGoals.preserveTraits.length === 0)) {
        setError("Define at least one breeding goal before running Goal-Based Match.");
        return;
      }
    }

    setError(null);
    startTransition(async () => {
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
          return;
        }
        setGoalResponse(result.response);
        setResponse(null);
        setSelectedCompareIds([]);
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
        return;
      }

      setResponse(result.response);
      setGoalResponse(null);
      setSelectedCompareIds([]);
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
        <p className="text-sm uppercase tracking-[0.2em] text-blue-400">Pedigree-Informed Discovery</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black text-white">Stallion Match</h1>
        <p className="mt-3 max-w-3xl text-gray-400">
          {matchMode === "pedigree"
            ? "Find pedigree-informed stallion matches for your mare. Rankings reflect available ancestry data and configured filters — not a prediction or guarantee of breeding outcomes."
            : "Define mare breeding goals, then rank stallions by trait alignment. Pedigree safety is evaluated separately and always shown alongside goal scores."}
        </p>
      </div>

      <div className="space-y-3">
        <div
          className="flex flex-wrap gap-3"
          role="tablist"
          aria-label="Stallion match mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={matchMode === "pedigree"}
            onClick={() => handleMatchModeChange("pedigree")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              matchMode === "pedigree"
                ? "bg-blue-600 text-white ring-2 ring-blue-400/50"
                : "border border-white/10 text-gray-300 hover:border-white/20"
            }`}
          >
            Pedigree Match
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={matchMode === "goal_based"}
            onClick={() => handleMatchModeChange("goal_based")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              matchMode === "goal_based"
                ? "bg-emerald-600 text-white ring-2 ring-emerald-400/50"
                : "border border-white/10 text-gray-300 hover:border-white/20"
            }`}
          >
            Goal-Based Match
          </button>
        </div>

        {matchMode === "goal_based" ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
            Goal-Based Match is active. Select a mare, define breeding goals below, then run the search.
            Pedigree safety gates still apply and are never overridden by trait scoring.
          </div>
        ) : null}
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Step 1</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Select Mare</h2>
        <p className="mt-2 text-sm text-gray-400">
          Search by name, registration number, or studbook. Horses are matched by pedigree UUID.
        </p>

        <input
          type="text"
          value={mareQuery}
          onChange={(event) => handleMareSearch(event.target.value)}
          placeholder="Search mares..."
          className="mt-5 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
        />

        {mareResults.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {mareResults.map((candidate) => (
              <li key={candidate.id}>
                <button
                  type="button"
                  onClick={() => handleSelectMare(candidate)}
                  className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-left hover:border-blue-500/40 transition"
                >
                  <p className="font-semibold text-white">{candidate.name}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {formatPedigreeIdentityLine({
                      name: candidate.name,
                      birthYear: candidate.birthYear,
                      sex: candidate.sex,
                      studbook: candidate.studbook,
                      sireName: candidate.sireName,
                      damSireName: candidate.damSireName,
                    })}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {mare ? (
          <div className="mt-5 rounded-2xl border border-blue-500/30 bg-[#08111F] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-white">{mare.name}</p>
                  {mare.verified ? <VerifiedBadge /> : null}
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {formatPedigreeIdentityLine({
                    name: mare.name,
                    birthYear: mare.birthYear,
                    sex: mare.sex,
                    studbook: mare.studbook,
                    sireName: mare.sireName,
                    damSireName: mare.damSireName,
                  })}
                </p>
                {mare.registrationNumber ? (
                  <p className="mt-1 text-xs text-gray-500">Registration: {mare.registrationNumber}</p>
                ) : null}
                {response ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Pedigree completeness (mare): {response.mareCompletenessPercent}%
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMare(null);
                  setResponse(null);
                  setGoalResponse(null);
                  setBreedingGoals(null);
                }}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear
              </button>
            </div>
            <Link
              href={`/pedigree/${mare.id}`}
              className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
            >
              View pedigree profile →
            </Link>
          </div>
        ) : null}
      </section>

      {matchMode === "goal_based" ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Step 2</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Define Breeding Goals</h2>
          </div>
          <BreedingGoalsPanel
            key={mare?.id ?? "no-mare"}
            marePedigreeId={mare?.id ?? null}
            onGoalsChange={setBreedingGoals}
          />
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
          Step {matchMode === "goal_based" ? 3 : 2}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">Preferences & Filters</h2>
        <p className="mt-2 text-sm text-gray-400">
          Filters apply equally to Pedigree Match and Goal-Based Match. Leave fields blank for no restriction.
          Mare studbook is never applied automatically.
        </p>

        <div className="mt-4 rounded-2xl border border-white/10 bg-[#08111F] p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500">Active query filters</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            {activeFilterSummary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block text-sm text-gray-300">
            Discipline
            <input
              type="text"
              value={filters.discipline ?? ""}
              onChange={(event) => setFilters((current) => ({ ...current, discipline: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
              placeholder="e.g. Show Jumping"
            />
          </label>
          <label className="block text-sm text-gray-300">
            Studbook
            <input
              type="text"
              value={filters.studbook ?? ""}
              onChange={(event) => setFilters((current) => ({ ...current, studbook: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
              placeholder="Any studbook (optional)"
            />
          </label>
          <label className="block text-sm text-gray-300">
            Country
            <input
              type="text"
              value={filters.country ?? ""}
              onChange={(event) => setFilters((current) => ({ ...current, country: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
              placeholder="e.g. Netherlands"
            />
          </label>
          <label className="block text-sm text-gray-300">
            Maximum stud fee
            <input
              type="number"
              min={0}
              value={filters.maxStudFee ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  maxStudFee: event.target.value ? Number(event.target.value) : null,
                }))
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
              placeholder="Optional"
            />
          </label>
          <label className="block text-sm text-gray-300">
            Stud fee currency
            <select
              value={filters.studFeeCurrency ?? "EUR"}
              onChange={(event) =>
                setFilters((current) => ({ ...current, studFeeCurrency: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
          <label className="block text-sm text-gray-300">
            Minimum pedigree confidence
            <select
              value={filters.minimumPedigreeConfidence ?? "any"}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  minimumPedigreeConfidence: event.target.value as MinimumPedigreeConfidenceFilter,
                }))
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white"
            >
              <option value="any">Any</option>
              <option value="moderate">Moderate+</option>
              <option value="high">High only</option>
            </select>
          </label>
        </div>

        <div className="mt-5">
          <p className="text-sm text-gray-300">Breeding method</p>
          <p className="mt-1 text-xs text-gray-500">
            Leave all unchecked for any breeding method. Selecting every method is treated as no restriction.
          </p>
          {allBreedingMethodsSelected ? (
            <p className="mt-2 text-xs text-emerald-300">
              All methods selected in the UI — applied as Any breeding method (no restriction).
            </p>
          ) : hasBreedingMethodUiSelection ? (
            <p className="mt-2 text-xs text-amber-200">
              Restricting to selected method(s). Stallions without documented breeding methods will be excluded.
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">Any breeding method</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {BREEDING_METHODS.map((method) => (
              <label key={method} className="inline-flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.breedingMethods?.includes(method) ?? false}
                  onChange={() => toggleBreedingMethod(method)}
                  className="rounded border-white/20 bg-[#08111F]"
                />
                {method}
              </label>
            ))}
          </div>
        </div>

        <label className="mt-5 inline-flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={Boolean(filters.includeUnavailable)}
            onChange={(event) =>
              setFilters((current) => ({ ...current, includeUnavailable: event.target.checked }))
            }
            className="rounded border-white/20 bg-[#08111F]"
          />
          Include unavailable stallions (booked / retired)
        </label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
          Step {matchMode === "goal_based" ? 4 : 3}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          {matchMode === "goal_based" ? "Find Goal-Based Matches" : "Find Stallion Matches"}
        </h2>
        {matchMode === "goal_based" ? (
          <p className="mt-2 text-sm text-gray-400">
            Requires a selected mare and at least one improve or preserve goal.
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleFindMatches}
          disabled={pending || !mare}
          className={`mt-5 rounded-xl px-6 py-3 font-semibold text-white transition disabled:opacity-50 ${
            matchMode === "goal_based"
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {pending
            ? matchMode === "goal_based"
              ? "Analyzing breeding goal alignment..."
              : "Analyzing pedigree compatibility..."
            : matchMode === "goal_based"
              ? "Find Goal-Based Matches"
              : "Find Stallion Matches"}
        </button>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </section>

      {goalResponse ? (
        <section className="space-y-5">
          <div>
            <h2 className="text-3xl font-bold text-white">Goal-Based Recommended Stallions</h2>
            <p className="mt-2 text-sm text-gray-400">
              Ranked by Breeding Goal Match. Pedigree safety is shown separately and never hidden.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {goalResponse.analyzedCount} eligible stallion{goalResponse.analyzedCount === 1 ? "" : "s"} analyzed
              {goalResponse.eligiblePoolCount > goalResponse.analyzedCount
                ? ` (from ${goalResponse.eligiblePoolCount} matching filters; top ${goalResponse.analyzedCount} evaluated)`
                : goalResponse.eligiblePoolCount > 0
                  ? ` (from ${goalResponse.eligiblePoolCount} matching filters)`
                  : ""}
            </p>
          </div>
          {goalResponse.results.length === 0 ? (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-8">
              <p className="text-lg font-semibold text-amber-100">No stallions to rank for Goal-Based Match</p>
              <p className="mt-2 text-sm text-amber-50/90">
                {goalResponse.emptyResultsReason ??
                  "No eligible active stallions with pedigree linkage matched the current mare and filters."}
              </p>
              <p className="mt-3 text-xs text-amber-100/80">
                Missing trait assessments do not remove stallions from this list. When trait evidence is limited,
                each stallion shows Insufficient Data for goal match scoring instead of a fabricated score.
              </p>
            </div>
          ) : (
            goalResponse.results.map((result) => (
              <GoalBasedResultCard key={result.pedigreeHorseId} result={result} marePedigreeId={mare!.id} />
            ))
          )}
          <p className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-xs text-gray-400">
            {goalResponse.disclaimer}
          </p>
        </section>
      ) : null}

      {response ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Recommended Stallions</h2>
              <p className="mt-2 text-sm text-gray-400">
                {response.analyzedCount} eligible stallion{response.analyzedCount === 1 ? "" : "s"} analyzed
                {response.eligiblePoolCount > response.analyzedCount
                  ? ` (from ${response.eligiblePoolCount} matching filters; top ${response.analyzedCount} evaluated)`
                  : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-300">
                Sort
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as RecommendationSortOption)}
                  className="ml-2 rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-white"
                >
                  <option value="best_match">Best Match</option>
                  <option value="highest_confidence">Highest Confidence</option>
                  {canSortByStudFee ? <option value="lowest_stud_fee">Lowest Stud Fee</option> : null}
                  <option value="name">Name</option>
                </select>
              </label>

              {selectedCompareIds.length >= 2 ? (
                <button
                  type="button"
                  onClick={handleCompareSelected}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition"
                >
                  Compare Selected ({selectedCompareIds.length})
                </button>
              ) : null}
            </div>
          </div>

          {sortedResults.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#111827] p-8 text-center">
              <p className="text-lg font-semibold text-white">No eligible stallions found.</p>
              <p className="mt-2 text-sm text-gray-400">Try removing some filters.</p>
            </div>
          ) : (
            sortedResults.map((result) => (
              <RecommendationResultCard
                key={result.candidate.pedigreeHorseId}
                result={result}
                marePedigreeId={mare!.id}
                selected={selectedCompareIds.includes(result.candidate.pedigreeHorseId)}
                onToggleSelect={toggleCompareSelection}
                compareDisabled={selectedCompareIds.length >= 3}
              />
            ))
          )}

          <p className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-xs text-gray-400">
            {response.disclaimer}
          </p>
        </section>
      ) : null}
    </div>
  );
}
