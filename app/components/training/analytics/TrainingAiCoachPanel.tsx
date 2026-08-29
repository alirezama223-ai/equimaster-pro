"use client";

import { useState } from "react";
import { applyTrainingAiNextSessionAction, getTrainingAiCoach } from "@/app/actions/training-ai";
import type { TrainingAiCoachResult } from "@/app/lib/training/ai-coach";

type Props = { horseId: string; horseName: string };

export default function TrainingAiCoachPanel({ horseId, horseName }: Props) {
  const [result, setResult] = useState<TrainingAiCoachResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    setAppliedMessage(null);
    const response = await getTrainingAiCoach(horseId);
    setResult(response.result);
    setError(response.error ?? null);
    setLoading(false);
  }

  async function applyNextSession() {
    if (!result || applying) return;

    setApplying(true);
    setError(null);
    setAppliedMessage(null);
    const response = await applyTrainingAiNextSessionAction(horseId, result.nextSession);

    if (response.error) {
      setError(response.error);
    } else if (response.sessionDate) {
      setAppliedMessage(
        response.created
          ? `AI recommendation applied to the next session (${response.sessionDate}).`
          : `AI recommendation updated the next planned session (${response.sessionDate}).`
      );
    }

    setApplying(false);
  }

  return (
    <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#111827] to-[#0b1528] p-6 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">AI COACH</p>
          <h2 className="mt-2 text-2xl font-black text-white">Training AI for {horseName}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Get a horse-specific assessment using recent workload, ratings, horse feeling, coach notes, and the existing training rules.
          </p>
        </div>
        <button
          type="button"
          onClick={analyze}
          disabled={loading || applying}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "Analyzing…" : result ? "Analyze again" : "Analyze with AI"}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      {appliedMessage ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
          {appliedMessage}
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/10 p-5 lg:col-span-2">
            <p className="text-sm font-bold text-white">{result.headline}</p>
            <p className="mt-3 text-sm leading-6 text-gray-300">{result.assessment}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
            <p className="text-sm font-bold text-white">Priorities</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              {result.priorities.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-5 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-white">Next session</p>
              <button
                type="button"
                onClick={applyNextSession}
                disabled={applying}
                className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-wait disabled:opacity-60"
              >
                {applying ? "Applying…" : "Apply to next session"}
              </button>
            </div>
            <ul className="mt-3 grid gap-2 text-sm text-gray-300 sm:grid-cols-2">
              {result.nextSession.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}
            </ul>
          </div>
          {result.caution ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm leading-6 text-amber-100">
              <p className="font-bold">Caution</p>
              <p className="mt-2">{result.caution}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
