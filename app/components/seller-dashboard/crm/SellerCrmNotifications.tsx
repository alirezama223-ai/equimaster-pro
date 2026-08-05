"use client";

import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import SellerDashboardEmptyState from "@/app/components/seller-dashboard/SellerDashboardEmptyState";
import type { CrmNotification, CrmNotificationType } from "@/app/components/seller-dashboard/crm/seller-crm-types";

const TYPE_ICONS: Record<CrmNotificationType, string> = {
  inquiry: "💬",
  favorite: "♥",
  "profile-view": "👁",
  "visit-request": "📅",
  offer: "💰",
};

type Props = {
  notifications: CrmNotification[];
};

function SellerCrmNotifications({ notifications }: Props) {
  const t = useTranslations("dashboard");
  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications]
  );

  return (
    <DashboardCard
      eyebrow={t("crm.notifications.eyebrow")}
      title={t("crm.notifications.title")}
      description={t("crm.notifications.description")}
      action={
        unreadCount > 0 ? (
          <span className="inline-flex min-h-7 items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 text-xs font-semibold text-blue-200">
            {t("crm.notifications.unreadBadge", { count: unreadCount })}
          </span>
        ) : null
      }
    >
      {notifications.length === 0 ? (
        <SellerDashboardEmptyState
          title={t("crm.notifications.emptyTitle")}
          message={t("crm.notifications.emptyMessage")}
          icon="🔔"
        />
      ) : (
        <ol className="relative space-y-0">
          <div className="absolute bottom-3 left-[18px] top-3 w-px bg-white/10" aria-hidden="true" />
          {notifications.map((notification) => (
            <li key={notification.id} className="relative pl-12 pb-6 last:pb-0">
              <span
                className={`absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
                  notification.unread
                    ? "border-blue-500/40 bg-blue-500/15 text-blue-100"
                    : "border-white/10 bg-[#08111F] text-gray-300"
                }`}
              >
                {TYPE_ICONS[notification.type]}
              </span>
              <div
                className={`rounded-2xl border p-4 ${
                  notification.unread
                    ? "border-blue-500/20 bg-blue-500/5"
                    : "border-white/[0.06] bg-[#08111F]/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{notification.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-400">
                      {notification.description}
                    </p>
                  </div>
                  {notification.unread ? (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-gray-500">{notification.timeLabel}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </DashboardCard>
  );
}

export default memo(SellerCrmNotifications);
