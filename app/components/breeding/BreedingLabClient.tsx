"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  deleteSavedBreedingAnalysis,
  getBreedingCandidateById,
  runBreedingAnalysis,
  runBreedingCompare,
  saveBreedingAnalysis,
} from "@/app/actions/breeding";
import BreedingAnalysisReportView from "@/app/components/breeding/BreedingAnalysisReportView";
import BreedingComparePanel from "@/app/components/breeding/BreedingComparePanel";
import PedigreeHorseSelector from "@/app/components/breeding/PedigreeHorseSelector";
import BreedingGoalAnalysisView from "@/app/components/breeding-goals/BreedingGoalAnalysisView";
import BreedingGoalsPanel from "@/app/components/breeding-goals/BreedingGoalsPanel";
import CombinedDecisionView from "@/app/components/breeding-goals/CombinedDecisionView";
import { analyzeBreedingGoalCross } from "@/app/actions/traits";
import {
  classifyRecommendationRisk,
  riskLevelLabel,
  scorePedigreeCompatibility,
} from "@/app/lib/breeding-recommendations/score";
import { BREEDING_DISCLAIMER } from "@/app/lib/breeding/constants";
import { BreedingAnalysisReport, BreedingCandidate, SavedBreedingAnalysis } from "@/app/types/breeding";
import { BreedingGoalAnalysisResult, MareBreedingGoals } from "@/app/types/traits";

type Props = {
  initialMareId: string | null;
  initialStallionId: string | null;
  initialCompareStallionIds: string[];
  savedAnalyses: SavedBreedingAnalysis[];
  isAuthenticated: boolean;
};

export default function BreedingLabClient({
  initialMareId,
  initialStallionId,
  initialCompareStallionIds,
  savedAnalyses,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const [mare, setMare] = useState<BreedingCandidate | null>(null);
  const [stallion, setStallion] = useState<BreedingCandidate | null>(null);
  const [compareStallions, setCompareStallions] = useState<BreedingCandidate[]>([]);
  const [report, setReport] = useState<BreedingAnalysisReport | null>(null);
  const [compareReports, setCompareReports] = useState<BreedingAnalysisReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(initialCompareStallionIds.length > 0);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(savedAnalyses);
  const [goalAnalysis, setGoalAnalysis] = useState<BreedingGoalAnalysisResult | null>(null);
  const [breedingGoals, setBreedingGoals] = useState<MareBreedingGoals | null>(null);
  const analyzedParamsRef = useRef<string | null>(null);

  const pedigreeScoreBreakdown = useMemo(
    () => (report ? scorePedigreeCompatibility(report) : null),
    [report]
  );

  const compareIds = useMemo(
    () =>
      compareMode
        ? [stallion, ...compareStallions].filter((item): item is BreedingCandidate => Boolean(item)).map((item) => item.id)
        : [],
    [compareMode, stallion, compareStallions]
  );

  const syncUrl = useCallback(
    (nextMareId: string | null, nextStallionIds: string[]) => {
      const params = new URLSearchParams();
      if (nextMareId) params.set("mare", nextMareId);
      if (nextStallionIds[0]) params.set("stallion", nextStallionIds[0]);
      if (nextStallionIds.length > 1) {
        params.set("compare", nextStallionIds.slice(1).join(","));
      }
      router.replace(params.toString() ? `/breeding-lab?${params.toString()}` : "/breeding-lab");
    },
    [router]
  );

  function scrollToAnalysisReport() {
    requestAnimationFrame(() => {
      document.getElementById("breeding-analysis-report")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const loadAndAnalyzeCross = useCallback(
    async (
      marePedigreeId: string,
      stallionPedigreeIds: string[],
      options?: { compare?: boolean; scroll?: boolean }
    ) => {
      const useCompare = options?.compare ?? stallionPedigreeIds.length > 1;
      const analysisKey = `${marePedigreeId}:${stallionPedigreeIds.join(",")}:${useCompare ? "compare" : "single"}`;

      setError(null);
      setCompareMode(useCompare);
      setCompareStallions([]);

      const [mareResult, stallionResult] = await Promise.all([
        getBreedingCandidateById(marePedigreeId),
        getBreedingCandidateById(stallionPedigreeIds[0]),
      ]);

      if (!mareResult.candidate) {
        setError(
          mareResult.error ??
            "The saved mare pedigree record could not be loaded. It may have been removed or is inaccessible."
        );
        setReport(null);
        setCompareReports([]);
        return false;
      }

      if (!stallionResult.candidate) {
        setError(
          stallionResult.error ??
            "The saved stallion pedigree record could not be loaded. It may have been removed or is inaccessible."
        );
        setReport(null);
        setCompareReports([]);
        return false;
      }

      setMare(mareResult.candidate);
      setStallion(stallionResult.candidate);
      syncUrl(marePedigreeId, stallionPedigreeIds);

      if (useCompare && stallionPedigreeIds.length > 1) {
        const extraStallionResults = await Promise.all(
          stallionPedigreeIds.slice(1).map((id) => getBreedingCandidateById(id))
        );
        const extraStallions = extraStallionResults
          .map((result) => result.candidate)
          .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

        if (extraStallions.length !== stallionPedigreeIds.length - 1) {
          setError("One or more comparison stallion records could not be loaded.");
          setReport(null);
          setCompareReports([]);
          return false;
        }

        setCompareStallions(extraStallions);

        const response = await runBreedingCompare({
          marePedigreeId,
          stallionPedigreeIds,
        });

        if (response.error) {
          setError(response.error);
          setReport(null);
          setCompareReports([]);
          return false;
        }

        setCompareReports(response.reports);
        setReport(response.reports[0] ?? null);
        analyzedParamsRef.current = analysisKey;
        const goalResult = await analyzeBreedingGoalCross({
          marePedigreeId,
          stallionPedigreeId: stallionPedigreeIds[0],
          goals: breedingGoals ?? undefined,
        });
        setGoalAnalysis(goalResult.analysis);
        if (options?.scroll !== false) scrollToAnalysisReport();
        return true;
      }

      const response = await runBreedingAnalysis({
        marePedigreeId,
        stallionPedigreeId: stallionPedigreeIds[0],
      });

      if (response.error || !response.report) {
        setError(response.error ?? "Analysis could not be generated.");
        setReport(null);
        setCompareReports([]);
        return false;
      }

      setReport(response.report);
      setCompareReports([]);
      analyzedParamsRef.current = analysisKey;

      if (mareResult.candidate && stallionResult.candidate) {
        const goalResult = await analyzeBreedingGoalCross({
          marePedigreeId: marePedigreeId,
          stallionPedigreeId: stallionPedigreeIds[0],
          goals: breedingGoals ?? undefined,
        });
        setGoalAnalysis(goalResult.analysis);
      } else {
        setGoalAnalysis(null);
      }

      if (options?.scroll !== false) scrollToAnalysisReport();
      return true;
    },
    [syncUrl, breedingGoals]
  );

  useEffect(() => {
    if (!initialMareId || !initialStallionId) return;

    const stallionPedigreeIds =
      initialCompareStallionIds.length > 0
        ? [initialStallionId, ...initialCompareStallionIds]
        : [initialStallionId];
    const analysisKey = `${initialMareId}:${stallionPedigreeIds.join(",")}:${
      initialCompareStallionIds.length > 0 ? "compare" : "single"
    }`;

    if (analyzedParamsRef.current === analysisKey) return;

    startTransition(async () => {
      await loadAndAnalyzeCross(initialMareId, stallionPedigreeIds, {
        compare: initialCompareStallionIds.length > 0,
        scroll: false,
      });
    });
  }, [initialMareId, initialStallionId, initialCompareStallionIds, loadAndAnalyzeCross]);

  function handleAnalyze() {
    if (!mare) {
      setError("Select a mare to analyze.");
      return;
    }

    const stallionIds = compareMode ? compareIds : stallion ? [stallion.id] : [];
    if (stallionIds.length === 0) {
      setError("Select at least one stallion to analyze.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const analysisKey = `${mare.id}:${stallionIds.join(",")}:${compareMode && stallionIds.length > 1 ? "compare" : "single"}`;

      if (compareMode && stallionIds.length > 1) {
        const response = await runBreedingCompare({
          marePedigreeId: mare.id,
          stallionPedigreeIds: stallionIds,
        });
        if (response.error) {
          setError(response.error);
          setReport(null);
          setCompareReports([]);
          return;
        }
        syncUrl(mare.id, stallionIds);
        setCompareReports(response.reports);
        setReport(response.reports[0] ?? null);
        analyzedParamsRef.current = analysisKey;
        scrollToAnalysisReport();
        return;
      }

      const response = await runBreedingAnalysis({
        marePedigreeId: mare.id,
        stallionPedigreeId: stallionIds[0],
      });
      if (response.error || !response.report) {
        setError(response.error ?? "Analysis could not be generated.");
        setReport(null);
        setCompareReports([]);
        return;
      }
      syncUrl(mare.id, stallionIds);
      setReport(response.report);
      setCompareReports([]);
      analyzedParamsRef.current = analysisKey;
      const goalResult = await analyzeBreedingGoalCross({
        marePedigreeId: mare.id,
        stallionPedigreeId: stallionIds[0],
        goals: breedingGoals ?? undefined,
      });
      setGoalAnalysis(goalResult.analysis);
      scrollToAnalysisReport();
    });
  }

  function handleOpenSaved(item: SavedBreedingAnalysis) {
    analyzedParamsRef.current = null;
    startTransition(async () => {
      await loadAndAnalyzeCross(item.marePedigreeId, [item.stallionPedigreeId], {
        compare: false,
        scroll: true,
      });
    });
  }

  function handleSaveAnalysis() {
    if (!mare || !report) return;
    startTransition(async () => {
      const response = await saveBreedingAnalysis({
        marePedigreeId: mare.id,
        stallionPedigreeId: report.stallion.id,
        title: `${mare.name} × ${report.stallion.name}`,
      });
      if (response.error) {
        setError(response.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDeleteSaved(id: string) {
    startTransition(async () => {
      const response = await deleteSavedBreedingAnalysis(id);
      if (response.error) {
        setError(response.error);
        return;
      }
      setSaved((current) => current.filter((item) => item.id !== id));
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-400">Breeding Decision Support</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black text-white">Breeding Lab</h1>
        <p className="mt-3 max-w-3xl text-gray-400">
          Mare × Stallion pedigree analysis for common ancestors, linebreeding patterns, close relationship
          warnings, and data confidence. Deterministic and explainable — not a genetic prediction tool.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setCompareMode(false)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            !compareMode ? "bg-blue-600 text-white" : "border border-white/10 text-gray-300"
          }`}
        >
          Single cross analysis
        </button>
        <button
          type="button"
          onClick={() => setCompareMode(true)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            compareMode ? "bg-blue-600 text-white" : "border border-white/10 text-gray-300"
          }`}
        >
          Compare up to 3 stallions
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PedigreeHorseSelector
          label="Left column"
          sex="mare"
          selected={mare}
          onSelect={(candidate) => {
            setMare(candidate);
            setGoalAnalysis(null);
          }}
          initialId={initialMareId}
        />
        <PedigreeHorseSelector
          label="Right column"
          sex="stallion"
          selected={stallion}
          onSelect={setStallion}
          initialId={initialStallionId}
        />
      </div>

      {mare ? (
        <BreedingGoalsPanel marePedigreeId={mare.id} onGoalsChange={setBreedingGoals} />
      ) : null}

      {compareMode ? (
        <div className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <h3 className="text-xl font-bold text-white">Additional stallions for comparison</h3>
          <p className="mt-2 text-sm text-gray-400">Add up to two more stallions beside the primary selection.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[0, 1].map((index) => (
              <PedigreeHorseSelector
                key={index}
                label={`Compare stallion ${index + 2}`}
                sex="stallion"
                selected={compareStallions[index] ?? null}
                onSelect={(candidate) => {
                  if (!candidate) {
                    setCompareStallions((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    return;
                  }
                  setCompareStallions((current) => {
                    const next = [...current];
                    next[index] = candidate;
                    return next.slice(0, 2);
                  });
                }}
                initialId={initialCompareStallionIds[index] ?? null}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={pending}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {pending ? "Analyzing..." : "Generate Pedigree Analysis"}
        </button>
        {report && isAuthenticated && !compareMode ? (
          <button
            type="button"
            onClick={handleSaveAnalysis}
            disabled={pending}
            className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-white hover:border-blue-500"
          >
            Save analysis
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 px-5 py-4 text-red-200">{error}</div>
      ) : null}

      {compareMode && compareReports.length > 1 ? (
        <BreedingComparePanel reports={compareReports} />
      ) : null}

      {report ? (
        <div id="breeding-analysis-report" className="space-y-6">
          <CombinedDecisionView
            report={report}
            pedigreeScoreBreakdown={pedigreeScoreBreakdown}
            pedigreeRiskLabel={
              pedigreeScoreBreakdown
                ? riskLevelLabel(classifyRecommendationRisk(report))
                : "INSUFFICIENT DATA"
            }
            pedigreeCompatibilityScore={
              pedigreeScoreBreakdown?.scoreAvailable ? pedigreeScoreBreakdown.total : null
            }
            goalAnalysis={goalAnalysis}
          />
          <BreedingAnalysisReportView report={report} />
          {goalAnalysis ? <BreedingGoalAnalysisView analysis={goalAnalysis} /> : null}
        </div>
      ) : null}

      {isAuthenticated ? (
        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <h3 className="text-2xl font-bold text-white">Saved analyses</h3>
          <p className="mt-2 text-sm text-gray-400">
            Saved references recompute from current pedigree data when reopened.
          </p>
          {saved.length === 0 ? (
            <p className="mt-4 text-gray-500">No saved analyses yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {saved.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#08111F] p-4"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {item.title ?? `${item.mareName} × ${item.stallionName}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.mareName} × {item.stallionName}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenSaved(item)}
                      disabled={pending}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSaved(item.id)}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-gray-500">
          <Link href="/login?next=/breeding-lab" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>{" "}
          to save breeding analyses.
        </p>
      )}

      <p className="text-sm text-gray-500 leading-6">{BREEDING_DISCLAIMER}</p>
    </div>
  );
}
