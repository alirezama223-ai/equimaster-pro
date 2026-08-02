import type { SupabaseClient } from "@supabase/supabase-js";
import { mapEventRow, isMissingTableError } from "@/app/lib/events/event-service";
import { sortEventsByUrgency } from "@/app/lib/events/format";
import type {
  HorseEvent,
  HorseEventTimeline,
  NotificationCenterData,
  TodaysAlertsData,
} from "@/app/types/events";

async function attachHorseNames(
  supabase: SupabaseClient,
  userId: string,
  events: HorseEvent[]
): Promise<HorseEvent[]> {
  const horseIds = [...new Set(events.map((event) => event.horseId))];
  if (horseIds.length === 0) return events;

  const nameMap = new Map<string, string>();

  const { data: pedigreeRows } = await supabase
    .from("pedigree_horses")
    .select("id, name")
    .in("id", horseIds);

  for (const row of pedigreeRows ?? []) {
    const name = (row.name as string | null | undefined)?.trim();
    if (name) nameMap.set(row.id as string, name);
  }

  return events.map((event) => ({
    ...event,
    horseName: nameMap.get(event.horseId) ?? event.horseName,
  }));
}

export async function fetchHorseEventTimeline(
  supabase: SupabaseClient,
  userId: string,
  horseId: string,
  limit = 50
): Promise<{ timeline: HorseEventTimeline; error?: string }> {
  const { data, error } = await supabase
    .from("horse_events")
    .select("*")
    .eq("created_by", userId)
    .eq("horse_id", horseId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) {
      return { timeline: { events: [], unresolvedCount: 0 }, error: "Event tables are not available yet. Run migration 027 in Supabase." };
    }
    return { timeline: { events: [], unresolvedCount: 0 }, error: error.message };
  }

  const events = await attachHorseNames(
    supabase,
    userId,
    (data ?? []).map((row) => mapEventRow(row))
  );

  return {
    timeline: {
      events,
      unresolvedCount: events.filter((event) => !event.resolved).length,
    },
  };
}

export async function fetchNotificationCenter(
  supabase: SupabaseClient,
  userId: string,
  limit = 40
): Promise<{ data: NotificationCenterData; error?: string }> {
  const { data, error } = await supabase
    .from("horse_events")
    .select("*")
    .eq("created_by", userId)
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) {
      return { data: { events: [], unresolvedCount: 0, alertCount: 0 } };
    }
    return { data: { events: [], unresolvedCount: 0, alertCount: 0 }, error: error.message };
  }

  const events = sortEventsByUrgency(
    await attachHorseNames(supabase, userId, (data ?? []).map((row) => mapEventRow(row)))
  );

  return {
    data: {
      events,
      unresolvedCount: events.length,
      alertCount: events.filter((event) => event.severity === "alert").length,
    },
  };
}

export async function fetchTodaysAlerts(
  supabase: SupabaseClient,
  userId: string,
  horseId?: string
): Promise<{ data: TodaysAlertsData; error?: string }> {
  let query = supabase
    .from("horse_events")
    .select("*")
    .eq("created_by", userId)
    .eq("resolved", false)
    .in("severity", ["alert", "watch"])
    .order("created_at", { ascending: false })
    .limit(12);

  if (horseId) {
    query = query.eq("horse_id", horseId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error.message)) {
      return { data: { alerts: [], alertCount: 0 } };
    }
    return { data: { alerts: [], alertCount: 0 }, error: error.message };
  }

  const alerts = sortEventsByUrgency(
    await attachHorseNames(supabase, userId, (data ?? []).map((row) => mapEventRow(row)))
  );

  return {
    data: {
      alerts,
      alertCount: alerts.filter((event) => event.severity === "alert").length,
    },
  };
}

export async function fetchUnresolvedEventCount(
  supabase: SupabaseClient,
  userId: string
): Promise<{ count: number; error?: string }> {
  const { count, error } = await supabase
    .from("horse_events")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId)
    .eq("resolved", false)
    .in("severity", ["alert", "watch"]);

  if (error) {
    if (isMissingTableError(error.message)) return { count: 0 };
    return { count: 0, error: error.message };
  }

  return { count: count ?? 0 };
}
