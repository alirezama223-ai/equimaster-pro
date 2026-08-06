"use client";

import { useLocale } from "next-intl";
import type { MessageRow } from "@/app/types/messaging";

type Props = {
  message: MessageRow;
  isOwnMessage: boolean;
  senderName: string;
};

function formatMessageTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MessageBubble({ message, isOwnMessage, senderName }: Props) {
  const locale = useLocale();

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isOwnMessage
            ? "bg-blue-600/25 border border-blue-500/30"
            : "bg-[#08111F] border border-white/10"
        }`}
      >
        {!isOwnMessage ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {senderName}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-100">
          {message.body}
        </p>
        <p className="mt-2 text-[11px] text-gray-500">
          {formatMessageTime(message.created_at, locale)}
        </p>
      </div>
    </div>
  );
}
