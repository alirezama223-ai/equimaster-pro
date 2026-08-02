"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { canManageTraitAssessments } from "@/app/lib/traits/access";
import { resolveHorseEvent } from "@/app/lib/events/event-service";
import {
  fetchHorseEventTimeline,
  fetchNotificationCenter,
  fetchTodaysAlerts,
  fetchUnresolvedEventCount,
} from "@/app/lib/events/queries";
import { syncHorseEventsFromAnalytics } from "@/app/lib/events/sync-horse-events";
import { fetchHorseTrainingAnalytics } from "@/app/lib/training/horse-analytics";
import { fetchManageableTrainingHorses } from "@/app/lib/training/queries";
import { createClient } from "@/app/lib/supabase/server";
import type {
  HorseEventTimeline,
  NotificationCenterData,
  TodaysAlertsData,
} from "@/app/types/events";
import type { TrainingHorse } from "@/app/types/training";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { supabase, user: null, error: error.message };
  }

  if (!user) {
    return { supabase, user: null, error: "You must be signed in to view events." };
  }

  return { supabase, user, error: undefined };
}

type HorseAccessSuccess = {
  supabase: SupabaseClient;
  user: User;
  horseName: string;
};

type HorseAccessResult = { error: string } | HorseAccessSuccess;

function isHorseAccessSuccess(access: HorseAccessResult): access is HorseAccessSuccess {
  return "supabase" in access;
}

async function requireHorseAccess(pedigreeHorseId: string): Promise<HorseAccessResult> {
  if (!isUuid(pedigreeHorseId)) {
    return { error: "Invalid horse selection." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { error: auth.error ?? "Authentication required." };
  }

  const canManage = await canManageTraitAssessments(auth.supabase, pedigreeHorseId, auth.user.id);
  if (!canManage) {
    return { error: "You do not have access to this horse." };
  }

  const horsesResult = await fetchManageableTrainingHorses(auth.supabase, auth.user.id);
  const horseName =
    horsesResult.horses.find((horse) => horse.id === pedigreeHorseId)?.name ?? "Unknown horse";

  return {
    supabase: auth.supabase,
    user: auth.user,
    horseName,
  };
}

export async function getNotificationCenter(): Promise<{
  data: NotificationCenterData;
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { data: { events: [], unresolvedCount: 0, alertCount: 0 }, error: auth.error };
  }

  return fetchNotificationCenter(auth.supabase, auth.user.id);
}

export async function getUnresolvedNotificationCount(): Promise<{
  count: number;
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { count: 0, error: auth.error };
  }

  return fetchUnresolvedEventCount(auth.supabase, auth.user.id);
}

export async function getTodaysAlerts(horseId?: string): Promise<{
  data: TodaysAlertsData;
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { data: { alerts: [], alertCount: 0 }, error: auth.error };
  }

  if (horseId && !isUuid(horseId)) {
    return { data: { alerts: [], alertCount: 0 }, error: "Invalid horse selection." };
  }

  if (horseId) {
    const access = await requireHorseAccess(horseId);
    if (!isHorseAccessSuccess(access)) {
      return { data: { alerts: [], alertCount: 0 }, error: access.error };
    }
  }

  return fetchTodaysAlerts(auth.supabase, auth.user.id, horseId);
}

export async function getHorseEventTimeline(pedigreeHorseId: string): Promise<{
  timeline: HorseEventTimeline | null;
  horseName?: string;
  error?: string;
}> {
  const access = await requireHorseAccess(pedigreeHorseId);
  if (!isHorseAccessSuccess(access)) {
    return { timeline: null, error: access.error };
  }

  const timelineResult = await fetchHorseEventTimeline(
    access.supabase,
    access.user.id,
    pedigreeHorseId
  );

  return {
    timeline: timelineResult.timeline,
    horseName: access.horseName,
    error: timelineResult.error,
  };
}

export async function getTimelineHorses(): Promise<{
  horses: TrainingHorse[];
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { horses: [], error: auth.error };
  }

  return fetchManageableTrainingHorses(auth.supabase, auth.user.id);
}

export async function resolveEventAction(eventId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isUuid(eventId)) {
    return { success: false, error: "Invalid event." };
  }

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { success: false, error: auth.error };
  }

  return resolveHorseEvent(auth.supabase, auth.user.id, eventId);
}

export async function syncHorseEventsAction(pedigreeHorseId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const access = await requireHorseAccess(pedigreeHorseId);
  if (!isHorseAccessSuccess(access)) {
    return { success: false, error: access.error };
  }

  const analyticsResult = await fetchHorseTrainingAnalytics(
    access.supabase,
    access.user.id,
    pedigreeHorseId,
    access.horseName
  );

  const syncResult = await syncHorseEventsFromAnalytics(
    access.supabase,
    access.user.id,
    pedigreeHorseId,
    access.horseName,
    analyticsResult.analytics
  );

  if (syncResult.error) {
    return { success: false, error: syncResult.error };
  }

  return { success: true };
}
