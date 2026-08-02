import type { SupabaseClient } from "@supabase/supabase-js";
import { formatEventTimestamp } from "@/app/lib/events/format";
import type {
  EventSourceModule,
  HorseEvent,
  PublishHorseEventInput,
} from "@/app/types/events";

type EventRow = Record<string, unknown>;

function mapEventRow(row: EventRow, horseName: string | null = null): HorseEvent {
  const createdAt = String(row.created_at);
  return {
    id: row.id as string,
    horseId: row.horse_id as string,
    horseName,
    eventType: row.event_type as HorseEvent["eventType"],
    severity: row.severity as HorseEvent["severity"],
    title: String(row.title),
    description: String(row.description),
    sourceModule: row.source_module as HorseEvent["sourceModule"],
    dedupeKey: String(row.dedupe_key),
    resolved: Boolean(row.resolved),
    resolvedAt: (row.resolved_at as string | null | undefined) ?? null,
    createdAt,
    createdAtLabel: formatEventTimestamp(createdAt),
  };
}

function isMissingTableError(message: string): boolean {
  return message.includes("horse_events") || message.includes("does not exist");
}

export async function publishHorseEvent(
  supabase: SupabaseClient,
  userId: string,
  input: PublishHorseEventInput
): Promise<{ event: HorseEvent | null; error?: string }> {
  const { data: existing, error: existingError } = await supabase
    .from("horse_events")
    .select("*")
    .eq("created_by", userId)
    .eq("horse_id", input.horseId)
    .eq("source_module", input.sourceModule)
    .eq("dedupe_key", input.dedupeKey)
    .eq("resolved", false)
    .maybeSingle();

  if (existingError && !isMissingTableError(existingError.message)) {
    return { event: null, error: existingError.message };
  }

  if (existing) {
    const { data, error } = await supabase
      .from("horse_events")
      .update({
        event_type: input.eventType,
        severity: input.severity,
        title: input.title.trim(),
        description: input.description.trim(),
      })
      .eq("id", existing.id as string)
      .eq("created_by", userId)
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error.message)) {
        return { event: null, error: "Event tables are not available yet. Run migration 027 in Supabase." };
      }
      return { event: null, error: error.message };
    }

    return { event: mapEventRow(data) };
  }

  const { data, error } = await supabase
    .from("horse_events")
    .insert({
      created_by: userId,
      horse_id: input.horseId,
      event_type: input.eventType,
      severity: input.severity,
      title: input.title.trim(),
      description: input.description.trim(),
      source_module: input.sourceModule,
      dedupe_key: input.dedupeKey,
      resolved: false,
      resolved_at: null,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      return { event: null, error: "Event tables are not available yet. Run migration 027 in Supabase." };
    }
    return { event: null, error: error.message };
  }

  return { event: mapEventRow(data) };
}

export async function syncModuleEvents(
  supabase: SupabaseClient,
  userId: string,
  horseId: string,
  sourceModule: EventSourceModule,
  desiredEvents: PublishHorseEventInput[]
): Promise<{ error?: string }> {
  const { data: existingRows, error: fetchError } = await supabase
    .from("horse_events")
    .select("id, dedupe_key")
    .eq("created_by", userId)
    .eq("horse_id", horseId)
    .eq("source_module", sourceModule)
    .eq("resolved", false);

  if (fetchError) {
    if (isMissingTableError(fetchError.message)) return {};
    return { error: fetchError.message };
  }

  const desiredKeys = new Set(desiredEvents.map((event) => event.dedupeKey));
  const toResolve = (existingRows ?? []).filter((row) => !desiredKeys.has(String(row.dedupe_key)));

  if (toResolve.length > 0) {
    const resolvedAt = new Date().toISOString();
    const { error: resolveError } = await supabase
      .from("horse_events")
      .update({ resolved: true, resolved_at: resolvedAt })
      .in(
        "id",
        toResolve.map((row) => row.id as string)
      )
      .eq("created_by", userId);

    if (resolveError && !isMissingTableError(resolveError.message)) {
      return { error: resolveError.message };
    }
  }

  const publishTasks = desiredEvents.map((event) =>
    publishHorseEvent(supabase, userId, event)
  );

  if (publishTasks.length === 0) {
    return {};
  }

  const publishResults = await Promise.all(publishTasks);
  const publishError = publishResults.find((result) => result.error)?.error;
  if (publishError) return { error: publishError };

  return {};
}

export async function resolveHorseEvent(
  supabase: SupabaseClient,
  userId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("horse_events")
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("created_by", userId);

  if (error) {
    if (isMissingTableError(error.message)) {
      return { success: false, error: "Event tables are not available yet. Run migration 027 in Supabase." };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

export { mapEventRow, isMissingTableError };
