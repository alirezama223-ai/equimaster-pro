"use client";

import Image from "next/image";
import { memo } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import SellerDashboardEmptyState from "@/app/components/seller-dashboard/SellerDashboardEmptyState";
import { getBuyerInitials } from "@/app/components/seller-dashboard/seller-dashboard-utils";
import type { SellerInquiry } from "@/app/types/inquiry";

type Props = {
  inquiries: SellerInquiry[];
  formatTime: (iso: string) => string;
};

function SellerDashboardMessages({ inquiries, formatTime }: Props) {
  const t = useTranslations("dashboard");

  return (
    <DashboardCard
      eyebrow={t("messages.eyebrow")}
      title={t("messages.title")}
      description={t("messages.description")}
    >
      {inquiries.length === 0 ? (
        <SellerDashboardEmptyState
          title={t("messages.emptyTitle")}
          message={t("messages.emptyMessage")}
          icon="💬"
        />
      ) : (
        <ul className="space-y-3">
          {inquiries.map((inquiry) => {
            const unread = inquiry.status === "new";

            return (
              <li
                key={inquiry.id}
                className="flex gap-4 rounded-2xl border border-white/[0.06] bg-[#08111F]/70 p-4 transition hover:border-white/10"
              >
                <div className="relative shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-sm font-bold text-white">
                    {getBuyerInitials(inquiry.buyer_name)}
                  </div>
                  {unread ? (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#08111F] bg-blue-500" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{inquiry.buyer_name}</p>
                      <p className="truncate text-sm text-blue-300">{inquiry.horse_name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-500">{formatTime(inquiry.created_at)}</p>
                      {unread ? (
                        <span className="mt-1 inline-flex rounded-full bg-blue-600/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200">
                          {t("messages.unread")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-400">
                    {inquiry.message}
                  </p>
                </div>

                {inquiry.horse_cover_image_url ? (
                  <div className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 sm:block">
                    <Image
                      src={inquiry.horse_cover_image_url}
                      alt={inquiry.horse_name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}

export default memo(SellerDashboardMessages);
