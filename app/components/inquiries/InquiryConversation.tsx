"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { sendInquiryReply } from "@/app/actions/inquiry-messages";
import { buildConversationMessages } from "@/app/lib/inquiry-conversation";
import { REPLY_MESSAGE_MAX } from "@/app/types/inquiry";
import {
  InquiryMessageRow,
  InquiryRow,
} from "@/app/types/inquiry";

type Props = {
  inquiry: Pick<
    InquiryRow,
    | "id"
    | "buyer_id"
    | "buyer_name"
    | "seller_id"
    | "message"
    | "created_at"
    | "horse_listing_id"
    | "status"
  > & {
    horse_name: string;
    messages: InquiryMessageRow[];
  };
  currentUserId: string;
  sellerName: string;
  onReplySent?: (message: InquiryMessageRow, nextStatus: string) => void;
};

function formatMessageDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function InquiryConversation({
  inquiry,
  currentUserId,
  sellerName,
  onReplySent,
}: Props) {
  const t = useTranslations("inquiries");
  const [messages, setMessages] = useState(inquiry.messages);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const viewerRole =
    currentUserId === inquiry.seller_id
      ? "seller"
      : currentUserId === inquiry.buyer_id
        ? "buyer"
        : null;

  const conversation = useMemo(
    () => buildConversationMessages(inquiry, messages, sellerName),
    [inquiry, messages, sellerName]
  );

  async function handleSendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending || inquiry.status === "archived") return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendInquiryReply(inquiry.id, replyText);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setMessages((current) => [...current, result.data!]);
        setReplyText("");
        setSuccess(t("conversation.replySent"));
        const nextStatus =
          viewerRole === "seller"
            ? "replied"
            : viewerRole === "buyer"
              ? "new"
              : inquiry.status;
        onReplySent?.(result.data, nextStatus);
      }
    } finally {
      setIsSending(false);
    }
  }

  if (!viewerRole) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{t("conversation.about")}</p>
          <Link
            href={`/horse/${inquiry.horse_listing_id}`}
            className="text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            {t("conversation.viewListing", { horseName: inquiry.horse_name })}
          </Link>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3 rounded-2xl bg-[#111827] border border-white/5 p-4">
        {conversation.map((entry) => {
          const isOwnMessage = entry.sender_id === currentUserId;

          return (
            <div
              key={entry.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  entry.sender_role === "seller"
                    ? "bg-blue-600/20 border border-blue-500/20"
                    : "bg-[#08111F] border border-white/10"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-white">
                    {entry.sender_name}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {entry.sender_role === "seller" ? t("conversation.seller") : t("conversation.buyer")}
                  </span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap leading-7">
                  {entry.message}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {formatMessageDate(entry.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {inquiry.status === "archived" ? (
        <p className="text-sm text-gray-500">
          {t("conversation.archivedNotice")}
        </p>
      ) : (
        <form className="space-y-3" onSubmit={handleSendReply}>
          <label htmlFor={`reply-${inquiry.id}`} className="block text-sm text-gray-300">
            {viewerRole === "seller" ? t("conversation.replyToBuyer") : t("conversation.replyToSeller")}
          </label>
          <textarea
            id={`reply-${inquiry.id}`}
            rows={4}
            value={replyText}
            onChange={(event) => {
              setReplyText(event.target.value);
              setError(null);
              setSuccess(null);
            }}
            maxLength={REPLY_MESSAGE_MAX}
            placeholder={t("conversation.replyPlaceholder")}
            className="w-full rounded-xl bg-[#08111F] border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-y"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              {replyText.length}/{REPLY_MESSAGE_MAX}
            </span>
            <button
              type="submit"
              disabled={isSending}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 text-white font-semibold transition"
            >
              {isSending ? t("conversation.sending") : t("conversation.sendReply")}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      ) : null}
    </div>
  );
}
