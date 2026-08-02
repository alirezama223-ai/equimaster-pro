"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import InquiryConversation from "@/app/components/inquiries/InquiryConversation";
import {
  BuyerInquiry,
  InquiryMessageRow,
  InquiryStatus,
} from "@/app/types/inquiry";

type Props = {
  initialInquiries: BuyerInquiry[];
  currentUserId: string;
  loadError?: string;
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  read: "bg-white/10 text-gray-300 border-white/10",
  replied: "bg-green-500/20 text-green-300 border-green-500/30",
  archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function formatInquiryDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function BuyerInquiriesSection({
  initialInquiries,
  currentUserId,
  loadError,
}: Props) {
  const t = useTranslations("account.buyerInquiries");
  const tInquiries = useTranslations("account.inquiries");
  const locale = useLocale();
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statusLabels: Record<InquiryStatus, string> = {
    new: tInquiries("statusNew"),
    read: tInquiries("statusRead"),
    replied: tInquiries("statusReplied"),
    archived: tInquiries("statusArchived"),
  };

  function handleReplySent(
    inquiryId: string,
    message: InquiryMessageRow,
    nextStatus: string
  ) {
    setInquiries((current) =>
      current.map((inquiry) =>
        inquiry.id === inquiryId
          ? {
              ...inquiry,
              messages: [...inquiry.messages, message],
              status: nextStatus as InquiryStatus,
            }
          : inquiry
      )
    );
  }

  return (
    <section className="rounded-3xl bg-[#111827] border border-white/10 p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">{t("title")}</h2>
        <p className="mt-2 text-gray-400">{t("subtitle")}</p>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      ) : null}

      {inquiries.length === 0 ? (
        <div className="rounded-2xl bg-[#08111F] border border-white/5 px-6 py-10 text-center">
          <p className="text-white font-semibold">{t("emptyTitle")}</p>
          <p className="mt-2 text-gray-400">{t("emptySubtitle")}</p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
          >
            {t("browseMarketplace")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => {
            const isExpanded = expandedId === inquiry.id;
            const hasSellerReply = inquiry.messages.some(
              (message) => message.sender_id === inquiry.seller_id
            );

            return (
              <article
                key={inquiry.id}
                className="rounded-2xl bg-[#08111F] border border-white/10 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-40 sm:h-auto sm:w-40 shrink-0">
                    <Image
                      src={inquiry.horse_cover_image_url}
                      alt={inquiry.horse_name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/horse/${inquiry.horse_listing_id}`}
                          className="text-lg font-bold text-white hover:text-blue-400 transition"
                        >
                          {inquiry.horse_name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {t("started", {
                            date: formatInquiryDate(inquiry.created_at, locale),
                          })}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[inquiry.status]}`}
                      >
                        {inquiry.status === "replied" || hasSellerReply
                          ? t("sellerReplied")
                          : statusLabels[inquiry.status]}
                      </span>
                    </div>

                    {!isExpanded ? (
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {inquiry.message}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((current) =>
                          current === inquiry.id ? null : inquiry.id
                        )
                      }
                      className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                    >
                      {isExpanded ? t("hideConversation") : t("viewConversation")}
                    </button>

                    {isExpanded ? (
                      <InquiryConversation
                        inquiry={inquiry}
                        currentUserId={currentUserId}
                        sellerName={inquiry.seller_display_name}
                        onReplySent={(message, nextStatus) =>
                          handleReplySent(inquiry.id, message, nextStatus)
                        }
                      />
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
