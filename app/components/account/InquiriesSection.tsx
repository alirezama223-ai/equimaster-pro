"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import {
  markInquiryRead,
  updateInquiryStatus,
} from "@/app/actions/inquiries";
import InquiryConversation from "@/app/components/inquiries/InquiryConversation";
import {
  InquiryMessageRow,
  InquiryStatus,
  SellerInquiry,
} from "@/app/types/inquiry";

type Props = {
  initialInquiries: SellerInquiry[];
  currentUserId: string;
  sellerName: string;
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

export default function InquiriesSection({
  initialInquiries,
  currentUserId,
  sellerName,
  loadError,
}: Props) {
  const t = useTranslations("account.inquiries");
  const locale = useLocale();
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusLabels: Record<InquiryStatus, string> = {
    new: t("statusNew"),
    read: t("statusRead"),
    replied: t("statusReplied"),
    archived: t("statusArchived"),
  };

  const visibleInquiries = inquiries.filter(
    (inquiry) => inquiry.status !== "archived"
  );
  const archivedInquiries = inquiries.filter(
    (inquiry) => inquiry.status === "archived"
  );

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

  async function handleStatusChange(inquiryId: string, status: InquiryStatus) {
    setPendingId(inquiryId);
    setError(null);

    const result = await updateInquiryStatus(inquiryId, status);

    if (result.error) {
      setError(result.error);
      setPendingId(null);
      return;
    }

    setInquiries((current) =>
      current.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, status } : inquiry
      )
    );
    setPendingId(null);
  }

  async function handleView(inquiry: SellerInquiry) {
    setExpandedId((current) => (current === inquiry.id ? null : inquiry.id));

    if (inquiry.status === "new") {
      setPendingId(inquiry.id);
      setError(null);

      const result = await markInquiryRead(inquiry.id);

      if (result.error) {
        setError(result.error);
        setPendingId(null);
        return;
      }

      setInquiries((current) =>
        current.map((item) =>
          item.id === inquiry.id ? { ...item, status: "read" } : item
        )
      );
      setPendingId(null);
    }
  }

  function renderInquiryCard(inquiry: SellerInquiry) {
    const horsePath = `/horse/${inquiry.horse_listing_id}`;
    const isExpanded = expandedId === inquiry.id;
    const isPending = pendingId === inquiry.id;

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
                  href={horsePath}
                  className="text-lg font-bold text-white hover:text-blue-400 transition"
                >
                  {inquiry.horse_name}
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  {formatInquiryDate(inquiry.created_at, locale)}
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[inquiry.status]}`}
              >
                {statusLabels[inquiry.status]}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">{t("buyer")}</p>
                <p className="text-white font-medium">{inquiry.buyer_name}</p>
              </div>
              <div>
                <p className="text-gray-500">{t("email")}</p>
                <p className="text-white break-all">{inquiry.buyer_email}</p>
              </div>
              {inquiry.buyer_phone ? (
                <div>
                  <p className="text-gray-500">{t("phone")}</p>
                  <p className="text-white">{inquiry.buyer_phone}</p>
                </div>
              ) : null}
            </div>

            {!isExpanded ? (
              <p className="text-gray-400 text-sm line-clamp-2">{inquiry.message}</p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleView(inquiry)}
                disabled={isPending}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition disabled:opacity-60"
              >
                {isExpanded ? t("hide") : t("view")}
              </button>

              {inquiry.status !== "read" && inquiry.status !== "replied" ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange(inquiry.id, "read")}
                  disabled={isPending}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition disabled:opacity-60"
                >
                  {t("markAsRead")}
                </button>
              ) : null}

              {inquiry.status !== "archived" ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange(inquiry.id, "archived")}
                  disabled={isPending}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 transition disabled:opacity-60"
                >
                  {t("archiveAction")}
                </button>
              ) : null}
            </div>

            {isExpanded ? (
              <InquiryConversation
                inquiry={inquiry}
                currentUserId={currentUserId}
                sellerName={sellerName}
                onReplySent={(message, nextStatus) =>
                  handleReplySent(inquiry.id, message, nextStatus)
                }
              />
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <section className="rounded-3xl bg-[#111827] border border-white/10 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{t("title")}</h2>
          <p className="mt-2 text-gray-400">{t("subtitle")}</p>
        </div>
        {inquiries.some((inquiry) => inquiry.status === "new") ? (
          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
            {t("newBadge", {
              count: inquiries.filter((inquiry) => inquiry.status === "new").length,
            })}
          </span>
        ) : null}
      </div>

      {loadError ? (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {visibleInquiries.length === 0 ? (
        <div className="rounded-2xl bg-[#08111F] border border-white/5 px-6 py-10 text-center">
          <p className="text-white font-semibold">{t("emptyTitle")}</p>
          <p className="mt-2 text-gray-400">{t("emptySubtitle")}</p>
        </div>
      ) : (
        <div className="space-y-4">{visibleInquiries.map(renderInquiryCard)}</div>
      )}

      {archivedInquiries.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            {t("archivedHeading")}
          </h3>
          <div className="space-y-4">
            {archivedInquiries.map(renderInquiryCard)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
