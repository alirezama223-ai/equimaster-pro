import type { BreederRow } from "@/app/types/breeder";
import { createClient } from "@/app/lib/supabase/server";
import { rowToBreeder } from "@/app/lib/breeders";

export async function getOptionalMyBreederProfile(): Promise<{
  breeder: BreederRow | null;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { breeder: null };
  }

  const { data, error } = await supabase
    .from("breeders")
    .select("*")
    .eq("owner_id", user.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // A normal marketplace user has no breeder profile. Treat that as an empty state,
  // not an application/runtime error.
  if (!data) {
    return { breeder: null, error: error?.message };
  }

  return { breeder: rowToBreeder(data as Record<string, unknown>), error: error?.message };
}
