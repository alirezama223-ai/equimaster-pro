import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertDemoUserState } from "@/app/lib/demo/preferences";

export async function cleanupDemoData(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error?: string }> {
  const { data: stateRow, error: stateError } = await supabase
    .from("demo_user_state")
    .select("demo_horse_ids, demo_listing_ids, demo_plan_ids")
    .eq("user_id", userId)
    .maybeSingle();

  if (stateError) {
    return { error: stateError.message };
  }

  const horseIds = (stateRow?.demo_horse_ids as string[] | null | undefined) ?? [];
  const resolvedListingIds = (stateRow?.demo_listing_ids as string[] | null | undefined) ?? [];
  const resolvedPlanIds = (stateRow?.demo_plan_ids as string[] | null | undefined) ?? [];

  if (horseIds.length === 0 && resolvedListingIds.length === 0 && resolvedPlanIds.length === 0) {
    await upsertDemoUserState(supabase, userId, {
      demoSeeded: false,
      demoHorseIds: [],
      demoListingIds: [],
      demoPlanIds: [],
      primaryDemoHorseId: null,
    });
    return {};
  }

  if (horseIds.length > 0) {
    const { error: assignmentError } = await supabase
      .from("training_plan_assignments")
      .delete()
      .eq("created_by", userId)
      .in("pedigree_horse_id", horseIds);

    if (assignmentError) {
      return { error: assignmentError.message };
    }
  }

  if (resolvedPlanIds.length > 0) {
    const { error: planError } = await supabase
      .from("training_plans")
      .delete()
      .eq("created_by", userId)
      .in("id", resolvedPlanIds);

    if (planError) {
      return { error: planError.message };
    }
  }

  if (resolvedListingIds.length > 0) {
    const { error: listingError } = await supabase
      .from("horse_listings")
      .delete()
      .eq("user_id", userId)
      .in("id", resolvedListingIds);

    if (listingError) {
      return { error: listingError.message };
    }
  }

  if (horseIds.length > 0) {
    const { error: horseError } = await supabase
      .from("pedigree_horses")
      .delete()
      .eq("created_by", userId)
      .in("id", horseIds);

    if (horseError) {
      return { error: horseError.message };
    }
  }

  await upsertDemoUserState(supabase, userId, {
    demoSeeded: false,
    demoHorseIds: [],
    demoListingIds: [],
    demoPlanIds: [],
    primaryDemoHorseId: null,
  });

  return {};
}
