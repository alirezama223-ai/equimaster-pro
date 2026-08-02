import type { SupabaseClient } from "@supabase/supabase-js";
import { syncModuleEvents } from "@/app/lib/events/event-service";
import {
  buildAnalyticsModuleEvents,
  buildHealthModuleEvents,
  buildRuleEngineEvents,
} from "@/app/lib/events/publishers";
import { fetchHorseHealthSnapshot } from "@/app/lib/health/horse-health";
import { evaluateHealthRules } from "@/app/lib/health/rules";
import type { HealthEvaluationResult } from "@/app/types/health";
import type { HorseTrainingAnalytics } from "@/app/types/training-analytics";

export async function syncHorseEventsFromAnalytics(
  supabase: SupabaseClient,
  userId: string,
  horseId: string,
  horseName: string,
  analytics: HorseTrainingAnalytics,
  healthEvaluation?: HealthEvaluationResult
): Promise<{ error?: string }> {
  const ruleEvents = buildRuleEngineEvents(horseId, analytics.ruleEvaluation);
  const analyticsEvents = buildAnalyticsModuleEvents(horseId, analytics.ruleEvaluation);

  const [ruleResult, analyticsResult] = await Promise.all([
    syncModuleEvents(supabase, userId, horseId, "rule_engine", ruleEvents),
    syncModuleEvents(supabase, userId, horseId, "analytics", analyticsEvents),
  ]);

  if (ruleResult.error) return ruleResult;
  if (analyticsResult.error) return analyticsResult;

  const resolvedHealthEvaluation =
    healthEvaluation ??
    evaluateHealthRules(
      (await fetchHorseHealthSnapshot(supabase, userId, horseId, horseName)).snapshot
    );
  const healthEvents = buildHealthModuleEvents(horseId, resolvedHealthEvaluation);

  return syncModuleEvents(supabase, userId, horseId, "health", healthEvents);
}
