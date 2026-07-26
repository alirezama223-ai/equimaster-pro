"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getMareBreedingGoals, saveMareBreedingGoals } from "@/app/actions/traits";
import { getTraitsByCategory } from "@/app/lib/traits/constants";
import { BreedingGoalEntry, GoalPriority, MareBreedingGoals, TraitKey } from "@/app/types/traits";

type Props = {
  marePedigreeId: string | null;
  onGoalsChange?: (goals: MareBreedingGoals | null) => void;
};

export default function BreedingGoalsPanel({ marePedigreeId, onGoalsChange }: Props) {
  const [goals, setGoals] = useState<MareBreedingGoals | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const grouped = getTraitsByCategory();

  const notifyGoals = useCallback(
    (next: MareBreedingGoals | null) => {
      onGoalsChange?.(next);
    },
    [onGoalsChange]
  );

  useEffect(() => {
    if (!marePedigreeId) return;

    let cancelled = false;
    startTransition(async () => {
      const result = await getMareBreedingGoals(marePedigreeId);
      if (cancelled) return;

      const loaded: MareBreedingGoals =
        result.goals ??
        ({
          marePedigreeId,
          improveGoals: [],
          preserveTraits: [],
          avoidReinforcingWeaknesses: true,
        } satisfies MareBreedingGoals);

      setGoals(loaded);
      notifyGoals(loaded);
      setMessage(result.error ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [marePedigreeId, notifyGoals]);

  function getImprovePriority(traitKey: TraitKey): GoalPriority | null {
    return goals?.improveGoals.find((item) => item.traitKey === traitKey)?.priority ?? null;
  }

  function toggleImprove(traitKey: TraitKey, priority: GoalPriority) {
    if (!goals || !marePedigreeId) return;
    const existing = goals.improveGoals.find((item) => item.traitKey === traitKey);
    const improveGoals = existing?.priority === priority
      ? goals.improveGoals.filter((item) => item.traitKey !== traitKey)
      : [
          ...goals.improveGoals.filter((item) => item.traitKey !== traitKey),
          { traitKey, priority } satisfies BreedingGoalEntry,
        ];
    const next = { ...goals, improveGoals };
    setGoals(next);
    notifyGoals(next);
  }

  function togglePreserve(traitKey: TraitKey) {
    if (!goals || !marePedigreeId) return;
    const preserveTraits = goals.preserveTraits.includes(traitKey)
      ? goals.preserveTraits.filter((item) => item !== traitKey)
      : [...goals.preserveTraits, traitKey];
    const next = { ...goals, preserveTraits };
    setGoals(next);
    notifyGoals(next);
  }

  function handleSave() {
    if (!goals || !marePedigreeId) return;
    startTransition(async () => {
      const result = await saveMareBreedingGoals({
        marePedigreeId,
        improveGoals: goals.improveGoals,
        preserveTraits: goals.preserveTraits,
        avoidReinforcingWeaknesses: goals.avoidReinforcingWeaknesses,
      });
      setMessage(result.success ? "Breeding goals saved." : result.error ?? "Save failed.");
    });
  }

  if (!marePedigreeId) {
    return (
      <div className="rounded-3xl border border-dashed border-emerald-500/30 bg-[#111827] p-6">
        <p className="text-sm text-emerald-100">
          Select a mare in Step 1 to load or define breeding goals for Goal-Based Match.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Breeding Goals</p>
        <h3 className="mt-2 text-2xl font-bold text-white">Define Mare Breeding Priorities</h3>
        <p className="mt-2 text-sm text-gray-400">
          Select traits to improve or preserve. Goals are used for trait alignment analysis only.
        </p>
      </div>

      {[...grouped.entries()].map(([category, traits]) => (
        <div key={category} className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
          <p className="font-semibold text-white">{traits[0]?.categoryLabel}</p>
          <div className="mt-3 space-y-3">
            {traits.map((trait) => {
              const improvePriority = getImprovePriority(trait.key);
              const preserve = goals?.preserveTraits.includes(trait.key) ?? false;
              return (
                <div key={trait.key} className="rounded-xl border border-white/10 p-3">
                  <p className="font-medium text-white">{trait.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["low", "medium", "high"] as GoalPriority[]).map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => toggleImprove(trait.key, priority)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          improvePriority === priority
                            ? "bg-blue-600 text-white"
                            : "border border-white/10 text-gray-300"
                        }`}
                      >
                        Improve · {priority}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => togglePreserve(trait.key)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                        preserve ? "bg-emerald-600 text-white" : "border border-white/10 text-gray-300"
                      }`}
                    >
                      Preserve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <label className="inline-flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={goals?.avoidReinforcingWeaknesses ?? true}
          onChange={(event) => {
            if (!goals) return;
            const next = { ...goals, avoidReinforcingWeaknesses: event.target.checked };
            setGoals(next);
            notifyGoals(next);
          }}
          className="rounded border-white/20 bg-[#08111F]"
        />
        Avoid reinforcing weaknesses
      </label>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending || !goals}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save Breeding Goals"}
      </button>

      {message ? (
        <p className={`text-sm ${message.includes("failed") || message.includes("Authentication") ? "text-red-300" : "text-gray-300"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
