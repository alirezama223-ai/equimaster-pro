"use server";

import { createClient } from "@/app/lib/supabase/server";

export type HeroStats = {
  activeListings: number;
  activeStallions: number;
  registeredBreeders: number;
};

export async function getHeroStats(): Promise<HeroStats> {
  const supabase = await createClient();

  const [
    { count: activeListings },
    { count: activeStallions },
    { count: registeredBreeders },
  ] = await Promise.all([
    supabase
      .from("horse_listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("stallions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("breeders")
      .select("id", { count: "exact", head: true })
      .neq("status", "archived"),
  ]);

  return {
    activeListings: activeListings ?? 0,
    activeStallions: activeStallions ?? 0,
    registeredBreeders: registeredBreeders ?? 0,
  };
}
