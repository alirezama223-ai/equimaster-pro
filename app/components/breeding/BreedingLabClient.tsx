"use client";

import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  deleteSavedBreedingAnalysis,
  getBreedingCandidateById,
  runBreedingAnalysis,
  runBreedingCompare,
  saveBreedingAnalysis,
} from "@/app/actions/breeding";
import { analyzeBreedingGoalCrossWithDemo } from "@/app/actions/demo-breeding-goals";
import BreedingAnalysisReportView from "@/app/components/breeding/BreedingAnalysisReportView";
import BreedingComparePanel from "@/app/components/breeding/BreedingComparePanel";
import PedigreeHorseSelector from "@/app/components/breeding/PedigreeHorseSelector";
import BreedingGoalAnalysisView from "@/app/components/breeding-goals/BreedingGoalAnalysisView";
import BreedingGoalsPanel from "@/app/components/breeding-goals/BreedingGoalsPanel";
import CombinedDecisionView from "@/app/components/breeding-goals/CombinedDecisionView";
import {
  classifyRecommendationRisk,
  riskLevelLabel,
  scorePedigreeCompatibility,
} from "@/app/lib/breeding-recommendations/score";
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
  const t = useTranslations("breeding");
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

  const goalsKey = useMemo(
    () =>
      breedingGoals
        ? JSON.stringify({
            improveGoals: breedingGoals.improveGoals,
            preserveTraits: breedingGoals.preserveTraits,
            avoidReinforcingWeaknesses: breedingGoals.avoidReinforcingWeaknesses,
          })
        : "none",
    [breedingGoals]
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
      const analysisKey = `${marePedigreeId}:${stallionPedigreeIds.join(",")}:${useCompare ? "compare" : "single"}:${goalsKey}`;

      setError(null);
      setCompareMode(useCompare);
      setCompareStallions([]);

      const [mareResult, stallionResult] = await Promise.all([
        getBreedingCandidateById(marePedigreeId),
        getBreedingCandidateById(stallionPedigreeIds[0]),
      ]);

      if (!mareResult.candidate) {
        setError(mareResult.error ?? t("lab.errorMareLoadFailed"));
        setReport(null);
        setCompareReports([]);
        return false;
      }

      if (!stallionResult.candidate) {
        setError(stallionResult.error ?? t("lab.errorStallionLoadFailed"));
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
          setError(t("lab.errorCompareLoadFailed"));
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
        const goalResult = await analyzeBreedingGoalCrossWithDemo({
          marePedigreeId,
          stallionPedigreeId: stallionPedigreeIds[0],
          goals: breedingGoals ?? undefined,
        });
        setGoalAnalysis(goalResult.analysis);
        if (goalResult.error) setError(goalResult.error);
        if (options?.scroll !== false) scrollToAnalysisReport();
        return true;
      }

      const response = await runBreedingAnalysis({
        marePedigreeId,
        stallionPedigreeId: stallionPedigreeIds[0],
      });

      if (response.error || !response.report) {
        setError(response.error ?? t("lab.errorAnalysisFailed"));
        setReport(null);
        setCompareReports([]);
        return false;
      }

      setReport(response.report);
      setCompareReports([]);
      analyzedParamsRef.current = analysisKey;

      if (mareResult.candidate && stallionResult.candidate) {
        const goalResult = await analyzeBreedingGoalCrossWithDemo({
          marePedigreeId,
          stallionPedigreeId: stallionPedigreeIds[0],
          goals: breedingGoals ?? undefined,
        });
        setGoalAnalysis(goalResult.analysis);
        if (goalResult.error) setError(goalResult.error);
      } else {
        setGoalAnalysis(null);
      }

      if (options?.scroll !== false) scrollToAnalysisReport();
      return true;
    },
    [syncUrl, breedingGoals, goalsKey]
  );

  useEffect(() => {
    if (!initialMareId || !initialStallionId) return;

    const stallionPedigreeIds =
      initialCompareStallionIds.length > 0
        ? [initialStallionId, ...initialCompareStallionIds]
        : [initialStallionId];
    const analysisKey = `${initialMareId}:${stallionPedigreeIds.join(",")}:${
      initialCompareStallionIds.length > 0 ? "compare" : "single"
    }:${goalsKey}`;

    if (analyzedParamsRef.current === analysisKey) return;

    startTransition(async () => {
      await loadAndAnalyzeCross(initialMareId, stallionPedigreeIds, {
        compare: initialCompareStallionIds.length > 0,
        scroll: false,
      });
    });
  }, [initialMareId, initialStallionId, initialCompareStallionIds, loadAndAnalyzeCross, goalsKey]);

  function handleAnalyze() {
    if (!mare) {
      setError(t("lab.errorSelectMare"));
      return;
    }

    const stallionIds = compareMode ? compareIds : stallion ? [stallion.id] : [];
    if (stallionIds.length === 0) {
      setError(t("lab.errorSelectStallion"));
      return;
    }

    setError(null);
    startTransition(async () => {
      const analysisKey = `${mare.id}:${stallionIds.join(",")}:${compareMode && stallionIds.length > 1 ? "compare" : "single"}:${goalsKey}`;

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
        const goalResult = await analyzeBreedingGoalCrossWithDemo({
          marePedigreeId: mare.id,
          stallionPedigreeId: stallionIds[0],
          goals: breedingGoals ?? undefined,
        });
        setGoalAnalysis(goalResult.analysis);
        if (goalResult.error) setError(goalResult.error);
        scrollToAnalysisReport();
        return;
      }

      const response = await runBreedingAnalysis({
        marePedigreeId: mare.id,
        stallionPedigreeId: stallionIds[0],
      });
      if (response.error || !response.report) {
        setError(response.error ?? t("lab.errorAnalysisFailed"));
        setReport(null);
        setCompareReports([]);
        return;
      }
      syncUrl(mare.id, stallionIds);
      setReport(response.report);
      setCompareReports([]);
      analyzedParamsRef.current = analysisKey;
      const goalResult = await analyzeBreedingGoalCrossWithDemo({
        marePedigreeId: mare.id,
        stallionPedigreeId: stallionIds[0],
        goals: breedingGoals ?? undefined,
      });
      setGoalAnalysis(goalResult.analysis);
      if (goalResult.error) setError(goalResult.error);
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
        <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("lab.eyebrow")}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black text-white">{t("lab.title")}</h1>
        <p className="mt-3 max-w-3xl text-gray-400">{t("lab.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setCompareMode(false)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${!compareMode ? "bg-blue-600 text-white" : "border border-white/10 text-gray-300"}`}>{t("lab.singleCross")}</button>
        <button type="button" onClick={() => setCompareMode(true)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${compareMode ? "bg-blue-600 text-white" : "border border-white/10 text-gray-300"}`}>{t("lab.compareStallions")}</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PedigreeHorseSelector label={t("lab.leftColumn")} sex="mare" selected={mare} onSelect={(candidate) => { setMare(candidate); setGoalAnalysis(null); }} initialId={initialMareId} />
        <PedigreeHorseSelector label={t("lab.rightColumn")} sex="stallion" selected={stallion} onSelect={setStallion} initialId={initialStallionId} />
      </div>

      {mare ? <BreedingGoalsPanel marePedigreeId={mare.id} onGoalsChange={setBreedingGoals} /> : null}

      {compareMode ? (
        <div className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <h3 className="text-xl font-bold text-white">{t("lab.additionalStallionsTitle")}</h3>
          <p className="mt-2 text-sm text-gray-400">{t("lab.additionalStallionsSubtitle")}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[0, 1].map((index) => (
              <PedigreeHorseSelector
                key={index}
                label={t("lab.compareStallionN", { n: index + 2 })}
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
                    return next;
                  });
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleAnalyze} disabled={pending || !mare || (!stallion && !compareMode)} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition disabled:opacity-50">{pending ? t("lab.analyzing") : t("lab.generateAnalysis")}</button>
        <button type="button" onClick={handleSaveAnalysis} disabled={pending || !mare || !report || !isAuthenticated} className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-white transition disabled:opacity-50">{t("lab.saveAnalysis")}</button>
        {!isAuthenticated ? <span className="self-center text-xs text-gray-500"><Link href={`/login?redirect=${encodeURIComponent("/breeding-lab")}`} className="text-blue-400 hover:text-blue-300">{`${t("lab.signInPrompt")} ${t("lab.signInSuffix")}`}</Link></span> : null}
      </div>

      {report ? (
        <div id="breeding-analysis-report" className="space-y-8">
          <CombinedDecisionView report={report} goalAnalysis={goalAnalysis} />
          {goalAnalysis ? <BreedingGoalAnalysisView analysis={goalAnalysis} /> : null}
          {compareMode && compareReports.length > 1 ? <BreedingComparePanel reports={compareReports} /> : null}
          <BreedingAnalysisReportView report={report} />
        </div>
      ) : null}

      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-white">{t("lab.savedAnalysesTitle")}</h2>
        {saved.length === 0 ? <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 text-sm text-gray-400">{t("lab.noSavedAnalyses")}</div> : saved.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111827] p-4">
            <div><p className="font-semibold text-white">{item.title}</p><p className="mt-1 text-xs text-gray-500">{item.createdAt}</p></div>
            <div className="flex gap-2"><button type="button" onClick={() => handleOpenSaved(item)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200">{t("open")}</button><button type="button" onClick={() => handleDeleteSaved(item.id)} className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-200">{t("delete")}</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
