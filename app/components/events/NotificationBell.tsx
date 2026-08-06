"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRecentNotifications,
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

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function NotificationBell() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    const result = await getRecentNotifications(8);
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!getSupabaseEnv().isConfigured) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useNotificationsRealtime({
    userId,
    onChange: () => {
      void refreshNotifications();
    },
  });

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleNotificationClick(notification: NotificationRow) {
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

    setOpen(false);
    router.push(getNotificationHref(notification));
  }

  const ariaLabel =
    unreadCount > 0 ? t("bell.ariaLabelWithCount", { count: unreadCount }) : t("bell.ariaLabel");

  if (!userId) {
    return (
      <Link
        href="/login"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-gray-300 transition hover:border-blue-500/40 hover:text-white"
        aria-label={ariaLabel}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 17H9l1-2h4l1 2Z" />
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
        </svg>
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-gray-300 transition hover:border-blue-500/40 hover:text-white"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 17H9l1-2h4l1 2Z" />
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,24rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">{t("dropdown.title")}</p>
            <p className="text-xs text-gray-500">{t("dropdown.subtitle")}</p>
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="space-y-3 p-4" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex animate-pulse gap-3">
                    <div className="h-11 w-11 rounded-full bg-white/10" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-white/10" />
                      <div className="h-3 w-full rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-white">{t("dropdown.emptyTitle")}</p>
                <p className="mt-2 text-xs text-gray-500">{t("dropdown.emptyMessage")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {notifications.map((notification) => {
                  const unread = notification.read_at === null;

                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => void handleNotificationClick(notification)}
                        className={`flex min-h-11 w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04] ${
                          unread ? "bg-blue-500/[0.04]" : ""
                        }`}
                      >
                        <span
                          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#08111F] text-base"
                          aria-hidden="true"
                        >
                          {NOTIFICATION_TYPE_ICONS[notification.type]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span
                              className={`line-clamp-1 text-sm ${unread ? "font-semibold text-white" : "font-medium text-gray-200"}`}
                            >
                              {notification.title}
                            </span>
                            <span className="shrink-0 text-[11px] text-gray-500">
                              {formatRelativeTime(notification.created_at, locale)}
                            </span>
                          </span>
                          <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">
                            {notification.body}
                          </span>
                        </span>
                        {unread ? (
                          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              {t("dropdown.viewAll")}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
