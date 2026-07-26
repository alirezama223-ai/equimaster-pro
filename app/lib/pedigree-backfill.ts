import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureListingPedigreeHorseId(
  supabase: SupabaseClient,
  listingId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("backfill_listing_pedigree_horse", {
    p_listing_id: listingId,
  });

  if (error) {
    console.error("[ensureListingPedigreeHorseId]", error.message);
    return null;
  }

  return (data as string | null) ?? null;
}

export async function ensureStallionPedigreeHorseId(
  supabase: SupabaseClient,
  stallionId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("backfill_stallion_pedigree_horse", {
    p_stallion_id: stallionId,
  });

  if (error) {
    console.error("[ensureStallionPedigreeHorseId]", error.message);
    return null;
  }

  return (data as string | null) ?? null;
}
