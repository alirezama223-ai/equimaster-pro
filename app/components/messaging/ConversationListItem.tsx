"use client";

import Image from "next/image";
import VerifiedBadge from "@/app/components/verification/VerifiedBadge";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getParticipantInitials } from "@/app/lib/messaging/display";
import type { ConversationPreview } from "@/app/types/messaging";

type Props = {
  conversation: ConversationPreview;
  isActive: boolean;
  href: string;
};

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

export default function ConversationListItem({ conversation, isActive, href }: Props) {
  const t = useTranslations("messaging");
  const locale = useLocale();
  const hasUnread = conversation.unread_count > 0;
  const preview =
    conversation.last_message_body?.trim() || t("inbox.noMessagesYet");

  return (
    <Link
      href={href}
      className={`flex min-w-0 gap-3 rounded-2xl border p-4 transition ${
        isActive
          ? "border-blue-500/40 bg-blue-500/10"
          : "border-white/[0.06] bg-[#08111F]/70 hover:border-white/10 hover:bg-[#0a1527]"
      }`}
    >
      <div className="relative shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-sm font-bold text-white">
          {getParticipantInitials(conversation.other_user_name)}
        </div>
        {hasUnread ? (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#08111F] bg-blue-500" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`truncate ${hasUnread ? "font-bold text-white" : "font-semibold text-white"}`}>
              {conversation.other_user_name}
            </p>
            <p className="truncate text-sm text-blue-300">{conversation.horse_name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {conversation.other_user_seller_verified ? (
                <VerifiedBadge compact label="seller" />
              ) : null}
              {conversation.horse_verified ? <VerifiedBadge compact label="horse" /> : null}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-500">
              {formatRelativeTime(conversation.last_message_at ?? conversation.updated_at, locale)}
            </p>
            {hasUnread ? (
              <span className="mt-1 inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
              </span>
            ) : null}
          </div>
        </div>
        <p className={`mt-2 line-clamp-2 text-sm leading-relaxed ${hasUnread ? "text-gray-200" : "text-gray-400"}`}>
          {preview}
        </p>
      </div>

      <div className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 sm:block">
        <Image
          src={conversation.horse_cover_image_url}
          alt={conversation.horse_name}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
    </Link>
  );
}
