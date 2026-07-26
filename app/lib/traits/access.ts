import type { SupabaseClient } from "@supabase/supabase-js";
import { TraitSourceType } from "@/app/types/traits";

export type PedigreeHorseManagementContext = {
  canManage: boolean;
  sourceType: TraitSourceType | null;
};

export async function getPedigreeHorseManagementContext(
  supabase: SupabaseClient,
  pedigreeHorseId: string,
  userId: string
): Promise<PedigreeHorseManagementContext> {
  const [{ data: pedigree }, { data: listing }, { data: stallion }, { data: linkedStallions }] =
    await Promise.all([
      supabase
        .from("pedigree_horses")
        .select("created_by")
        .eq("id", pedigreeHorseId)
        .maybeSingle(),
      supabase
        .from("horse_listings")
        .select("id")
        .eq("pedigree_horse_id", pedigreeHorseId)
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("stallions")
        .select("id")
        .eq("pedigree_horse_id", pedigreeHorseId)
        .eq("owner_id", userId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("stallions")
        .select("breeder_id")
        .eq("pedigree_horse_id", pedigreeHorseId),
    ]);

  const isPedigreeCreator = pedigree?.created_by === userId;
  const ownsListing = Boolean(listing?.id);
  const ownsStallion = Boolean(stallion?.id);

  let ownsBreederStudFarm = false;
  const breederIds = (linkedStallions ?? [])
    .map((row) => row.breeder_id as string | null)
    .filter(Boolean) as string[];

  if (breederIds.length > 0) {
    const { data: breeder } = await supabase
      .from("breeders")
      .select("id")
      .in("id", [...new Set(breederIds)])
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    ownsBreederStudFarm = Boolean(breeder?.id);
  }

  if (!isPedigreeCreator && !ownsListing && !ownsStallion && !ownsBreederStudFarm) {
    return { canManage: false, sourceType: null };
  }

  if (ownsBreederStudFarm && !ownsListing && !ownsStallion && !isPedigreeCreator) {
    return { canManage: true, sourceType: "breeder_reported" };
  }

  return { canManage: true, sourceType: "owner_reported" };
}

export async function canManageTraitAssessments(
  supabase: SupabaseClient,
  pedigreeHorseId: string,
  userId: string
): Promise<boolean> {
  const context = await getPedigreeHorseManagementContext(supabase, pedigreeHorseId, userId);
  return context.canManage;
}

export async function resolveTraitSubmissionSourceType(
  supabase: SupabaseClient,
  pedigreeHorseId: string,
  userId: string
): Promise<TraitSourceType | null> {
  const context = await getPedigreeHorseManagementContext(supabase, pedigreeHorseId, userId);
  return context.sourceType;
}
