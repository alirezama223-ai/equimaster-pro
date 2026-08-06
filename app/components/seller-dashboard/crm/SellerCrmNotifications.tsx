"use client";

import { Link } from "@/i18n/navigation";
import { memo } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import SellerDashboardEmptyState from "@/app/components/seller-dashboard/SellerDashboardEmptyState";
import { formatDashboardRelativeTime } from "@/app/components/seller-dashboard/dashboard-i18n";
import { getNotificationHref } from "@/app/lib/notifications/routes";
import type { CrmNotification } from "@/app/components/seller-dashboard/crm/seller-crm-types";
import { NOTIFICATION_TYPE_ICONS } from "@/app/types/user-notification";

type Props = {
  notifications: CrmNotification[];
};

function SellerCrmNotifications({ notifications }: Props) {
  const t = useTranslations("dashboard");
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  return (
    <DashboardCard
      eyebrow={t("crm.notifications.eyebrow")}
      title={t("crm.notifications.title")}
      description={t("crm.notifications.description")}
      action={
        <Link
          href="/notifications"
          className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-3 text-xs font-semibold text-blue-200 transition hover:bg-white/[0.05]"
        >
          {t("crm.notifications.viewAll")}
        </Link>
      }
    >
      {notifications.length === 0 ? (
        <SellerDashboardEmptyState
          title={t("crm.notifications.emptyTitle")}
          message={t("crm.notifications.emptyMessage")}
          icon="🔔"
        />
      ) : (
        <>
          {unreadCount > 0 ? (
            <div className="mb-4">
              <span className="inline-flex min-h-7 items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 text-xs font-semibold text-blue-200">
                {t("crm.notifications.unreadBadge", { count: unreadCount })}
              </span>
            </div>
          ) : null}

          <ol className="relative space-y-0">
            <div className="absolute bottom-3 left-[18px] top-3 w-px bg-white/10" aria-hidden="true" />
            {notifications.map((notification) => {
              const href = getNotificationHref({
                id: notification.id,
                user_id: "",
                type: notification.type,
                title: notification.title,
                body: notification.body,
                entity_id: notification.entityId ?? null,
                read_at: notification.unread ? null : notification.timeAt,
                created_at: notification.timeAt,
              });

              return (
                <li key={notification.id} className="relative pl-12 pb-6 last:pb-0">
                  <span
                    className={`absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
                      notification.unread
                        ? "border-blue-500/40 bg-blue-500/15"
                        : "border-white/10 bg-[#08111F]"
                    }`}
                    aria-hidden="true"
                  >
                    {NOTIFICATION_TYPE_ICONS[notification.type]}
                  </span>
                  <Link
                    href={href}
                    className={`block rounded-2xl border p-4 transition hover:border-white/15 ${
                      notification.unread
                        ? "border-blue-500/20 bg-blue-500/5"
                        : "border-white/[0.06] bg-[#08111F]/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{notification.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-400">
                          {notification.body}
                        </p>
                      </div>
                      {notification.unread ? (
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      {formatDashboardRelativeTime(notification.timeAt, t)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </DashboardCard>
  );
}

export default memo(SellerCrmNotifications);
