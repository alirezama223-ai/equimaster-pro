import type { SupabaseClient } from "@supabase/supabase-js";
import { mapExerciseLibraryRow } from "@/app/lib/training/plans/exercises";
import type { ExerciseLibraryItem } from "@/app/lib/training/plans/exercises";

const EXERCISE_LIBRARY_SELECT = "id, name, description, category, duration_minutes";

function buildRestQueryPath(params: {
  select: string;
  filters: string[];
  order?: string;
}): string {
  const search = new URLSearchParams();
  search.set("select", params.select);
  for (const filter of params.filters) {
    const [key, value] = filter.split("=", 2);
    if (key && value !== undefined) {
      search.set(key, value);
    }
  }
  if (params.order) {
    search.set("order", params.order);
  }
  return `/rest/v1/exercises?${search.toString()}`;
}

function sortExerciseRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...rows].sort((left, right) => {
    const categoryCompare = String(left.category).localeCompare(String(right.category));
    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return String(left.name).localeCompare(String(right.name));
  });
}

export async function fetchExerciseLibrary(
  supabase: SupabaseClient,
  userId: string
): Promise<{ exercises: ExerciseLibraryItem[]; error?: string }> {
  const legacyOrFilter = `source.eq.system,created_by.eq.${userId}`;

  console.log("[fetchExerciseLibrary] trace start", {
    table: "public.exercises",
    schema: "public (Supabase client default)",
    userId,
    select: EXERCISE_LIBRARY_SELECT,
    filters: {
      source: "system OR created_by = userId (legacy .or filter removed)",
      is_active: "not used (column does not exist on public.exercises)",
      deleted_at: "not used (column does not exist on public.exercises)",
      organization_id: "not used (column does not exist on public.exercises)",
    },
    legacyOrFilter,
    legacyRestEquivalent: buildRestQueryPath({
      select: EXERCISE_LIBRARY_SELECT,
      filters: [`or`, `(${legacyOrFilter})`],
      order: "category.asc,name.asc",
    }),
    activeQueries: {
      system: buildRestQueryPath({
        select: EXERCISE_LIBRARY_SELECT,
        filters: ["source", "eq.system"],
        order: "category.asc,name.asc",
      }),
      user: buildRestQueryPath({
        select: EXERCISE_LIBRARY_SELECT,
        filters: ["source", "eq.user", "created_by", `eq.${userId}`],
        order: "category.asc,name.asc",
      }),
      rlsProbe: buildRestQueryPath({
        select: "id",
        filters: [],
      }),
    },
  });

  console.log("Loading exercises...");

  const [systemResult, userResult, rlsProbeResult] = await Promise.all([
    supabase
      .from("exercises")
      .select(EXERCISE_LIBRARY_SELECT)
      .eq("source", "system")
      .order("category", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("exercises")
      .select(EXERCISE_LIBRARY_SELECT)
      .eq("source", "user")
      .eq("created_by", userId)
      .order("category", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("exercises").select("id", { count: "exact", head: true }),
  ]);

  console.log("Loading exercises... data", {
    system: systemResult.data,
    user: userResult.data,
    rlsProbeCount: rlsProbeResult.count ?? null,
  });
  console.log("Loading exercises... error", {
    system: systemResult.error,
    user: userResult.error,
    rlsProbe: rlsProbeResult.error,
  });

  console.log("[fetchExerciseLibrary] diagnostic results", {
    systemRows: systemResult.data?.length ?? 0,
    systemError: systemResult.error?.message ?? null,
    systemStatus: systemResult.status,
    systemSample: (systemResult.data ?? []).slice(0, 3),
    userRows: userResult.data?.length ?? 0,
    userError: userResult.error?.message ?? null,
    userStatus: userResult.status,
    userSample: (userResult.data ?? []).slice(0, 3),
    rlsProbeCount: rlsProbeResult.count ?? null,
    rlsProbeError: rlsProbeResult.error?.message ?? null,
    rlsProbeStatus: rlsProbeResult.status,
  });

  const queryError = systemResult.error ?? userResult.error;
  if (queryError) {
    console.log("[fetchExerciseLibrary] returning empty due to Supabase error", {
      message: queryError.message,
      hint:
        queryError.message.includes("permission denied")
          ? "authenticated role likely missing GRANT SELECT on public.exercises"
          : undefined,
    });
    return { exercises: [], error: queryError.message };
  }

  const mergedById = new Map<string, Record<string, unknown>>();
  for (const row of [...(systemResult.data ?? []), ...(userResult.data ?? [])]) {
    mergedById.set(row.id as string, row as Record<string, unknown>);
  }

  const mergedRows = sortExerciseRows(Array.from(mergedById.values()));

  console.log("[fetchExerciseLibrary] trace end", {
    mergedRowCount: mergedRows.length,
    reasonWhenEmpty:
      mergedRows.length === 0
        ? rlsProbeResult.error?.message
          ? "Supabase returned an error on probe query"
          : (rlsProbeResult.count ?? 0) === 0
            ? "RLS or table grants allow zero visible rows for this authenticated user"
            : "Application filters returned zero rows even though probe count was non-zero"
        : null,
  });

  return {
    exercises: mergedRows.map((row) => mapExerciseLibraryRow(row)),
  };
}
