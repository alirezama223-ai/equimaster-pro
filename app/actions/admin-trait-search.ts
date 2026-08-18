"use server";

import { requireAdmin } from "@/app/lib/admin";

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
