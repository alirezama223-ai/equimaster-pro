"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/user-notifications";
import { useNotificationsRealtime } from "@/app/hooks/useNotificationsRealtime";
import { getNotificationHref } from "@/app/lib/notifications/routes";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";
import type { NotificationRow } from "@/app/types/user-notification";
import { NOTIFICATION_TYPE_ICONS } from "@/app/types/user-notification";

function formatRelativeTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationCenterClient() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, startLoadMoreTransition] = useTransition();

  useEffect(() => {
    if (!getSupabaseEnv().isConfigured) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const loadPage = useCallback(async (nextPage: number, append: boolean) => {
    setLoading(!append);
    const result = await getNotifications(nextPage);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setNotifications((current) =>
      append
        ? [...current, ...result.notifications.filter((item) => !current.some((row) => row.id === item.id))]
        : result.notifications
    );
    setUnreadCount(result.unreadCount);
    setHasMore(result.hasMore);
    setPage(nextPage);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;
    void loadPage(1, false);
  }, [loadPage, userId]);

  useNotificationsRealtime({
    userId,
    onChange: () => {
      void loadPage(1, false);
    },
  });

  async function handleOpen(notification: NotificationRow) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, read_at: item.read_at ?? new Date().toISOString() }
          : item
      )
    );
    setUnreadCount((current) => Math.max(0, current - (notification.read_at ? 0 : 1)));

    if (!notification.read_at) {
      void markNotificationRead(notification.id);
    }

    router.push(getNotificationHref(notification));
  }

  function handleLoadMore() {
    startLoadMoreTransition(async () => {
      await loadPage(page + 1, true);
    });
  }

  function handleMarkAllRead() {
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read_at: item.read_at ?? new Date().toISOString(),
      }))
    );
    setUnreadCount(0);
    void markAllNotificationsRead();
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("center.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{t("center.title")}</h1>
        <p className="mt-3 max-w-2xl text-gray-400">{t("center.description")}</p>
        {!loading ? (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>
              {t("center.unreadLabel")}:{" "}
              <span className="font-semibold text-white">{unreadCount}</span>
            </span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                {t("center.markAllRead")}
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-white/10 bg-[#111827] p-4">
              <div className="flex gap-3">
                <div className="h-11 w-11 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-white/10" />
                  <div className="h-3 w-full rounded bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#111827] px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl">
            🔔
          </div>
          <h2 className="text-lg font-semibold text-white">{t("center.allClearTitle")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">{t("center.allClearDescription")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const unread = notification.read_at === null;

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleOpen(notification)}
                className={`flex min-h-11 w-full items-start gap-4 rounded-2xl border p-4 text-left transition hover:border-white/15 ${
                  unread
                    ? "border-blue-500/20 bg-blue-500/[0.05]"
                    : "border-white/10 bg-[#111827]"
                }`}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#08111F] text-lg"
                  aria-hidden="true"
                >
                  {NOTIFICATION_TYPE_ICONS[notification.type]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-start justify-between gap-2">
                    <span className={`text-base ${unread ? "font-semibold text-white" : "font-medium text-gray-200"}`}>
                      {notification.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(notification.created_at, locale)}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-gray-400">{notification.body}</span>
                </span>
                {unread ? (
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                ) : null}
              </button>
            );
          })}

          {hasMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06] disabled:opacity-60"
            >
              {isLoadingMore ? t("center.loadingMore") : t("center.loadMore")}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
