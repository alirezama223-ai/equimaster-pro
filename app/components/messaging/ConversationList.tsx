"use client";

import { useTranslations } from "next-intl";
import ConversationListItem from "@/app/components/messaging/ConversationListItem";
import { InboxListSkeleton } from "@/app/components/messaging/MessagingSkeletons";
import type { ConversationPreview } from "@/app/types/messaging";

type Props = {
  conversations: ConversationPreview[];
  activeConversationId: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  buildHref: (conversationId: string) => string;
};

export default function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  buildHref,
}: Props) {
  const t = useTranslations("messaging");

  if (isLoading) {
    return <InboxListSkeleton />;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl">
          💬
        </div>
        <h2 className="text-lg font-semibold text-white">{t("inbox.emptyTitle")}</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-400">
          {t("inbox.emptyMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-semibold text-white">{t("inbox.title")}</h2>
        <p className="mt-1 text-sm text-gray-400">{t("inbox.subtitle")}</p>
      </div>

      <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationListItem
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              href={buildHref(conversation.id)}
            />
          </li>
        ))}
      </ul>

      {hasMore ? (
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? t("inbox.loadingMore") : t("inbox.loadMore")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
