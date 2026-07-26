"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/admin";
import { analyzeBreedingGoalsCross } from "@/app/lib/breeding-goals/analyze";
import { runGoalBasedRecommendations } from "@/app/lib/breeding-goals/recommendations";
import { getRecommendationMareById } from "@/app/actions/breeding-recommendations";
import { canManageTraitAssessments, resolveTraitSubmissionSourceType } from "@/app/lib/traits/access";
import { buildHorseTraitProfile } from "@/app/lib/traits/aggregate";
import { getTraitDefinition, isValidTraitKey } from "@/app/lib/traits/constants";
import { formatSourceType } from "@/app/lib/traits/evidence-labels";
import {
  isUuid,
  validateAdminSubmission,
  validateAdminUpdate,
  validateManagerSubmission,
} from "@/app/lib/traits/validation";
import { createClient } from "@/app/lib/supabase/server";
import {
  BreedingGoalAnalysisResult,
  BreedingGoalEntry,
  GoalMatchSortOption,
  HorseTraitAssessmentRow,
  HorseTraitProfile,
  MareBreedingGoals,
  TraitAssessmentConfidence,
  TraitEvidenceHistoryRow,
  TraitKey,
  TraitSourceType,
} from "@/app/types/traits";
import { StallionRecommendationFilters } from "@/app/types/breeding-recommendations";

function rowToAssessment(row: Record<string, unknown>): HorseTraitAssessmentRow {
  return {
    id: String(row.id),
    pedigree_horse_id: String(row.pedigree_horse_id),
    trait_key: String(row.trait_key),
    score: Number(row.score),
    confidence: row.confidence as TraitAssessmentConfidence,
    source_type: row.source_type as TraitSourceType,
    source_note: (row.source_note as string | null | undefined) ?? null,
    verified: Boolean(row.verified),
    created_by: (row.created_by as string | null | undefined) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeGoalEntry(value: unknown): BreedingGoalEntry | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const traitKey = record.traitKey ?? record.trait_key;
  const priority = record.priority;
  if (typeof traitKey !== "string" || !isValidTraitKey(traitKey)) return null;
  if (priority !== "low" && priority !== "medium" && priority !== "high") return null;
  return { traitKey, priority };
}

function parseGoalsPayload(input: {
  improveGoals?: unknown;
  preserveTraits?: unknown;
  avoidReinforcingWeaknesses?: boolean;
}): Pick<MareBreedingGoals, "improveGoals" | "preserveTraits" | "avoidReinforcingWeaknesses"> {
  const improveGoals = (Array.isArray(input.improveGoals) ? input.improveGoals : [])
    .map((goal) => normalizeGoalEntry(goal))
    .filter((goal): goal is BreedingGoalEntry => goal !== null);
  const preserveTraits = (Array.isArray(input.preserveTraits) ? input.preserveTraits : [])
    .map((value) => (typeof value === "string" ? value : null))
    .filter((key): key is TraitKey => Boolean(key && isValidTraitKey(key)));
  return {
    improveGoals,
    preserveTraits,
    avoidReinforcingWeaknesses: input.avoidReinforcingWeaknesses ?? true,
  };
}

export async function getHorseTraitProfile(pedigreeHorseId: string): Promise<{
  profile: HorseTraitProfile | null;
  canManage: boolean;
  error?: string;
}> {
  if (!isUuid(pedigreeHorseId)) {
    return { profile: null, canManage: false, error: "Invalid pedigree ID." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("horse_trait_assessments_public")
    .select("*")
    .eq("pedigree_horse_id", pedigreeHorseId)
    .order("created_at", { ascending: false });

  if (error) {
    return { profile: null, canManage: false, error: error.message };
  }

  const canManage = user ? await canManageTraitAssessments(supabase, pedigreeHorseId, user.id) : false;

  return {
    profile: buildHorseTraitProfile(
      pedigreeHorseId,
      (data ?? []).map((row) => rowToAssessment(row as Record<string, unknown>))
    ),
    canManage,
  };
}

export async function submitTraitAssessment(input: {
  pedigreeHorseId: string;
  traitKey: string;
  score: number;
  confidence: TraitAssessmentConfidence;
  sourceNote?: string;
}) {
  const validationError = validateManagerSubmission({
    pedigreeHorseId: input.pedigreeHorseId,
    traitKey: input.traitKey,
    score: input.score,
    confidence: input.confidence,
  });
  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required." };

  const sourceType = await resolveTraitSubmissionSourceType(
    supabase,
    input.pedigreeHorseId,
    user.id
  );
  if (!sourceType) {
    return { success: false, error: "You are not authorized to submit trait assessments for this horse." };
  }

  const { error } = await supabase.from("horse_trait_assessments").insert({
    pedigree_horse_id: input.pedigreeHorseId,
    trait_key: input.traitKey,
    score: input.score,
    confidence: input.confidence,
    source_type: sourceType,
    source_note: input.sourceNote?.trim() || null,
    created_by: user.id,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/pedigree/${input.pedigreeHorseId}`);
  revalidatePath(`/pedigree/${input.pedigreeHorseId}/traits`);
  revalidatePath("/breeding-lab");
  revalidatePath("/breeding-recommendations");
  return { success: true };
}

export async function getManagerTraitSubmissionContext(pedigreeHorseId: string): Promise<{
  canManage: boolean;
  sourceType: TraitSourceType | null;
  sourceLabel: string | null;
  error?: string;
}> {
  if (!isUuid(pedigreeHorseId)) {
    return { canManage: false, sourceType: null, sourceLabel: null, error: "Invalid horse reference." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { canManage: false, sourceType: null, sourceLabel: null };
  }

  const sourceType = await resolveTraitSubmissionSourceType(supabase, pedigreeHorseId, user.id);
  return {
    canManage: Boolean(sourceType),
    sourceType,
    sourceLabel: sourceType ? formatSourceType(sourceType) : null,
  };
}

export async function getTraitEvidenceHistory(pedigreeHorseId: string): Promise<{
  rows: TraitEvidenceHistoryRow[];
  canManage: boolean;
  error?: string;
}> {
  if (!isUuid(pedigreeHorseId)) {
    return { rows: [], canManage: false, error: "Invalid horse reference." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const canManage = user ? await canManageTraitAssessments(supabase, pedigreeHorseId, user.id) : false;
  if (!canManage) {
    return { rows: [], canManage: false, error: "Not authorized to view trait evidence history." };
  }

  const { data, error } = await supabase
    .from("horse_trait_assessments")
    .select("*")
    .eq("pedigree_horse_id", pedigreeHorseId)
    .order("created_at", { ascending: false });

  if (error) return { rows: [], canManage, error: error.message };

  const rows = (data ?? []).map((row) => {
    const assessment = rowToAssessment(row as Record<string, unknown>);
    const traitKey = assessment.trait_key as TraitKey;
    return {
      id: assessment.id,
      pedigreeHorseId: assessment.pedigree_horse_id,
      traitKey,
      traitLabel: isValidTraitKey(traitKey) ? getTraitDefinition(traitKey).label : traitKey,
      score: assessment.score,
      confidence: assessment.confidence,
      sourceType: assessment.source_type,
      sourceNote: assessment.source_note,
      verified: assessment.verified,
      createdAt: assessment.created_at,
      canDelete: Boolean(user && assessment.created_by === user.id && !assessment.verified),
    } satisfies TraitEvidenceHistoryRow;
  });

  return { rows, canManage };
}

export async function submitAdminTraitAssessment(input: {
  pedigreeHorseId: string;
  traitKey: string;
  score: number;
  confidence: TraitAssessmentConfidence;
  sourceType: TraitSourceType;
  sourceNote?: string;
}) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { success: false, error: auth.error ?? "Forbidden" };
  }

  const validationError = validateAdminSubmission({
    pedigreeHorseId: input.pedigreeHorseId,
    traitKey: input.traitKey,
    score: input.score,
    confidence: input.confidence,
    sourceType: input.sourceType,
  });
  if (validationError) {
    return { success: false, error: validationError };
  }

  const { error } = await auth.supabase.from("horse_trait_assessments").insert({
    pedigree_horse_id: input.pedigreeHorseId,
    trait_key: input.traitKey,
    score: input.score,
    confidence: input.confidence,
    source_type: input.sourceType,
    source_note: input.sourceNote?.trim() || null,
    verified: false,
    created_by: auth.user.id,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/traits");
  revalidatePath(`/pedigree/${input.pedigreeHorseId}`);
  revalidatePath(`/pedigree/${input.pedigreeHorseId}/traits`);
  revalidatePath("/breeding-lab");
  revalidatePath("/breeding-recommendations");
  return { success: true };
}

export async function searchAdminPedigreeHorsesForTraits(query: string): Promise<{
  horses: Array<{ id: string; name: string; sex: string | null }>;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { horses: [], error: auth.error ?? "Forbidden" };
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { horses: [] };
  }

  const safeQuery = trimmed.replace(/[%_,]/g, "");
  const normalizedPattern = safeQuery.replace(/\s+/g, "%");

  const { data, error } = await auth.supabase
    .from("pedigree_horses")
    .select("id, name, sex")
    .or(`name.ilike.%${safeQuery}%,normalized_name.ilike.%${normalizedPattern}%`)
    .order("name", { ascending: true })
    .limit(20);

  if (error) return { horses: [], error: error.message };

  return {
    horses: (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      sex: (row.sex as string | null) ?? null,
    })),
  };
}

export async function adminUpdateTraitAssessment(input: {
  assessmentId: string;
  traitKey: string;
  score: number;
  confidence: TraitAssessmentConfidence;
  sourceType: TraitSourceType;
  sourceNote?: string;
}): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { success: false, error: auth.error ?? "Forbidden" };
  }

  const validationError = validateAdminUpdate({
    assessmentId: input.assessmentId,
    traitKey: input.traitKey,
    score: input.score,
    confidence: input.confidence,
    sourceType: input.sourceType,
  });
  if (validationError) {
    return { success: false, error: validationError };
  }

  const { data: row } = await auth.supabase
    .from("horse_trait_assessments")
    .select("pedigree_horse_id")
    .eq("id", input.assessmentId)
    .maybeSingle();

  if (!row) return { success: false, error: "Assessment not found." };

  const { error } = await auth.supabase
    .from("horse_trait_assessments")
    .update({
      trait_key: input.traitKey,
      score: input.score,
      confidence: input.confidence,
      source_type: input.sourceType,
      source_note: input.sourceNote?.trim() || null,
    })
    .eq("id", input.assessmentId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/traits");
  revalidatePath(`/pedigree/${row.pedigree_horse_id}`);
  revalidatePath(`/pedigree/${row.pedigree_horse_id}/traits`);
  revalidatePath("/breeding-lab");
  revalidatePath("/breeding-recommendations");
  return { success: true };
}

export async function adminDeleteTraitAssessment(assessmentId: string): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Forbidden" };
  if (!isUuid(assessmentId)) return { error: "Invalid assessment ID." };

  const { data: row } = await auth.supabase
    .from("horse_trait_assessments")
    .select("pedigree_horse_id")
    .eq("id", assessmentId)
    .maybeSingle();

  if (!row) return { error: "Assessment not found." };

  const { error } = await auth.supabase.from("horse_trait_assessments").delete().eq("id", assessmentId);
  if (error) return { error: error.message };

  revalidatePath("/admin/traits");
  revalidatePath(`/pedigree/${row.pedigree_horse_id}`);
  return {};
}

export async function deleteTraitAssessment(assessmentId: string) {
  if (!isUuid(assessmentId)) return { success: false, error: "Invalid assessment ID." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required." };

  const { data: row } = await supabase
    .from("horse_trait_assessments")
    .select("pedigree_horse_id, created_by, verified")
    .eq("id", assessmentId)
    .maybeSingle();

  if (!row) return { success: false, error: "Assessment not found." };
  if (row.verified) return { success: false, error: "Verified assessments cannot be deleted." };
  if (row.created_by !== user.id) {
    return { success: false, error: "You can only delete your own unverified assessments." };
  }

  const { error } = await supabase.from("horse_trait_assessments").delete().eq("id", assessmentId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/pedigree/${row.pedigree_horse_id}`);
  return { success: true };
}

export async function setTraitAssessmentVerified(
  assessmentId: string,
  verified: boolean
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Forbidden" };

  const { data: row } = await auth.supabase
    .from("horse_trait_assessments")
    .select("pedigree_horse_id")
    .eq("id", assessmentId)
    .maybeSingle();

  if (!row) return { error: "Assessment not found." };

  const { error } = await auth.supabase
    .from("horse_trait_assessments")
    .update({ verified })
    .eq("id", assessmentId);

  if (error) return { error: error.message };

  revalidatePath("/admin/traits");
  revalidatePath(`/pedigree/${row.pedigree_horse_id}`);
  return {};
}

export async function getMareBreedingGoals(marePedigreeId: string): Promise<{
  goals: MareBreedingGoals | null;
  error?: string;
}> {
  if (!isUuid(marePedigreeId)) return { goals: null, error: "Invalid mare pedigree ID." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      goals: {
        marePedigreeId,
        improveGoals: [],
        preserveTraits: [],
        avoidReinforcingWeaknesses: true,
      },
    };
  }

  const { data, error } = await supabase
    .from("mare_breeding_goals")
    .select("goals, preserve_traits, avoid_reinforcing_weaknesses")
    .eq("user_id", user.id)
    .eq("mare_pedigree_id", marePedigreeId)
    .maybeSingle();

  if (error) return { goals: null, error: error.message };
  if (!data) {
    return {
      goals: {
        marePedigreeId,
        improveGoals: [],
        preserveTraits: [],
        avoidReinforcingWeaknesses: true,
      },
    };
  }

  const parsed = parseGoalsPayload({
    improveGoals: data.goals,
    preserveTraits: data.preserve_traits,
    avoidReinforcingWeaknesses: Boolean(data.avoid_reinforcing_weaknesses),
  });

  return {
    goals: {
      marePedigreeId,
      ...parsed,
    },
  };
}

export async function saveMareBreedingGoals(input: {
  marePedigreeId: string;
  improveGoals: BreedingGoalEntry[];
  preserveTraits: TraitKey[];
  avoidReinforcingWeaknesses: boolean;
}) {
  if (!isUuid(input.marePedigreeId)) return { success: false, error: "Invalid mare pedigree ID." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required." };

  const parsed = parseGoalsPayload(input);
  const { error } = await supabase.from("mare_breeding_goals").upsert(
    {
      user_id: user.id,
      mare_pedigree_id: input.marePedigreeId,
      goals: parsed.improveGoals,
      preserve_traits: parsed.preserveTraits,
      avoid_reinforcing_weaknesses: parsed.avoidReinforcingWeaknesses,
    },
    { onConflict: "user_id,mare_pedigree_id" }
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/breeding-lab");
  revalidatePath("/breeding-recommendations");
  return { success: true };
}

export async function analyzeBreedingGoalCross(input: {
  marePedigreeId: string;
  stallionPedigreeId: string;
  goals?: MareBreedingGoals;
}): Promise<{ analysis: BreedingGoalAnalysisResult | null; mareProfile: HorseTraitProfile | null; stallionProfile: HorseTraitProfile | null; error?: string }> {
  if (!isUuid(input.marePedigreeId) || !isUuid(input.stallionPedigreeId)) {
    return { analysis: null, mareProfile: null, stallionProfile: null, error: "Invalid pedigree IDs." };
  }

  const [mareTraits, stallionTraits, goalsResult] = await Promise.all([
    getHorseTraitProfile(input.marePedigreeId),
    getHorseTraitProfile(input.stallionPedigreeId),
    input.goals
      ? Promise.resolve({ goals: input.goals })
      : getMareBreedingGoals(input.marePedigreeId),
  ]);

  if (!mareTraits.profile || !stallionTraits.profile) {
    return {
      analysis: null,
      mareProfile: mareTraits.profile,
      stallionProfile: stallionTraits.profile,
    };
  }

  const goals =
    goalsResult.goals ??
    ({
      marePedigreeId: input.marePedigreeId,
      improveGoals: [],
      preserveTraits: [],
      avoidReinforcingWeaknesses: true,
    } satisfies MareBreedingGoals);

  return {
    analysis: analyzeBreedingGoalsCross(mareTraits.profile, stallionTraits.profile, goals),
    mareProfile: mareTraits.profile,
    stallionProfile: stallionTraits.profile,
  };
}

export async function runGoalBasedRecommendationSearch(input: {
  marePedigreeId: string;
  goals: MareBreedingGoals;
  filters?: StallionRecommendationFilters;
  sort?: GoalMatchSortOption;
}) {
  const mareResult = await getRecommendationMareById(input.marePedigreeId);
  if (!mareResult.candidate) {
    return { response: null, error: mareResult.error ?? "Mare not found." };
  }

  const parsedGoals = parseGoalsPayload(input.goals);
  if (parsedGoals.improveGoals.length === 0 && parsedGoals.preserveTraits.length === 0) {
    return {
      response: null,
      error: "Define at least one valid breeding goal before running Goal-Based Match.",
    };
  }

  const goals: MareBreedingGoals = {
    marePedigreeId: input.marePedigreeId,
    ...parsedGoals,
  };

  const supabase = await createClient();
  return runGoalBasedRecommendations(
    supabase,
    mareResult.candidate,
    goals,
    input.filters ?? {},
    input.sort ?? "best_goal_match"
  );
}

export async function getAdminTraitAssessments(options: {
  filter?: "pending" | "verified" | "all";
  sourceType?: TraitSourceType;
  pedigreeHorseId?: string;
} = {}) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { assessments: [], error: auth.error ?? "Forbidden" };

  const filter = options.filter ?? "all";

  let query = auth.supabase
    .from("horse_trait_assessments")
    .select("*, pedigree_horses(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter === "pending") query = query.eq("verified", false);
  if (filter === "verified") query = query.eq("verified", true);
  if (options.sourceType) query = query.eq("source_type", options.sourceType);
  if (options.pedigreeHorseId && isUuid(options.pedigreeHorseId)) {
    query = query.eq("pedigree_horse_id", options.pedigreeHorseId);
  }

  const { data, error } = await query;
  if (error) return { assessments: [], error: error.message };

  return {
    assessments: (data ?? []).map((row) => ({
      ...rowToAssessment(row as Record<string, unknown>),
      horseName: ((row as { pedigree_horses?: { name?: string } }).pedigree_horses?.name ?? "Unknown") as string,
    })),
  };
}

export async function getAdminTraitStats() {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { pending: 0, verified: 0, total: 0 };

  const [{ count: total }, { count: verified }] = await Promise.all([
    auth.supabase.from("horse_trait_assessments").select("*", { count: "exact", head: true }),
    auth.supabase
      .from("horse_trait_assessments")
      .select("*", { count: "exact", head: true })
      .eq("verified", true),
  ]);

  const totalCount = total ?? 0;
  const verifiedCount = verified ?? 0;
  return { pending: totalCount - verifiedCount, verified: verifiedCount, total: totalCount };
}
