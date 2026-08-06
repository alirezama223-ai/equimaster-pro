"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import type { NotificationRow } from "@/app/types/user-notification";
import { NOTIFICATIONS_PAGE_SIZE } from "@/app/types/user-notification";

function notificationsPath() {
  return "/notifications";
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error || count === null) {
    return 0;
  }

  return count;
}

export async function getNotifications(page = 1, pageSize = NOTIFICATIONS_PAGE_SIZE): Promise<{
  notifications: NotificationRow[];
  hasMore: boolean;
  unreadCount: number;
  error?: string;
  unauthenticated?: true;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      notifications: [],
      hasMore: false,
      unreadCount: 0,
      unauthenticated: true,
    };
  }

  const safePage = Math.max(page, 1);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize;

  const [listResult, unreadCount] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to),
    getUnreadNotificationCount(),
  ]);

  if (listResult.error) {
    console.error("[getNotifications] failed", listResult.error);
    return {
      notifications: [],
      hasMore: false,
      unreadCount: 0,
      error: "Unable to load notifications.",
    };
  }

  const fetched = (listResult.data ?? []) as NotificationRow[];
  const hasMore = fetched.length > pageSize;
  const notifications = hasMore ? fetched.slice(0, pageSize) : fetched;

  return {
    notifications,
    hasMore,
    unreadCount,
  };
}

export async function getRecentNotifications(limit = 8): Promise<{
  notifications: NotificationRow[];
  unreadCount: number;
  error?: string;
  unauthenticated?: true;
}> {
  const result = await getNotifications(1, limit);
  return {
    notifications: result.notifications,
    unreadCount: result.unreadCount,
    error: result.error,
    unauthenticated: result.unauthenticated,
  };
}

export async function markNotificationRead(notificationId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[markNotificationRead] failed", error);
    return { error: "Unable to mark notification as read." };
  }

  revalidatePath(notificationsPath());
  return {};
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[markAllNotificationsRead] failed", error);
    return { error: "Unable to mark notifications as read." };
  }

  revalidatePath(notificationsPath());
  return {};
}
