"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { getConversations } from "@/app/actions/messaging";
import ChatPanel from "@/app/components/messaging/ChatPanel";
import ConversationList from "@/app/components/messaging/ConversationList";
import { useUnreadMessagesRealtime } from "@/app/hooks/useConversationRealtime";
import type { ConversationPreview, ConversationThread } from "@/app/types/messaging";

type Props = {
  currentUserId: string;
  initialConversations: ConversationPreview[];
  initialHasMore: boolean;
  selectedConversationId: string | null;
  initialThread: ConversationThread | null;
  initialThreadHasMore: boolean;
};

export default function InboxClient({
  currentUserId,
  initialConversations,
  initialHasMore,
  selectedConversationId,
  initialThread,
  initialThreadHasMore,
}: Props) {
  const t = useTranslations("messaging");
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState(initialConversations);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [isLoadingMore, startLoadMoreTransition] = useTransition();

  useEffect(() => {
    setConversations(initialConversations);
    setHasMore(initialHasMore);
    setPage(1);
  }, [initialConversations, initialHasMore]);

  const refreshConversations = useCallback(async () => {
    const result = await getConversations(1);
    if (!result.error) {
      setConversations(result.conversations);
      setHasMore(result.hasMore);
      setPage(1);
    }
  }, []);

  useUnreadMessagesRealtime(() => {
    void refreshConversations();
  });

  function buildHref(conversationId: string) {
    return `/inbox/${conversationId}`;
  }

  function handleBackToList() {
    router.push("/inbox");
  }

  function handleLoadMore() {
    startLoadMoreTransition(async () => {
      const nextPage = page + 1;
      const result = await getConversations(nextPage);
      if (result.error) return;

      setConversations((current) => {
        const seen = new Set(current.map((item) => item.id));
        const merged = [...current];

        for (const conversation of result.conversations) {
          if (!seen.has(conversation.id)) {
            merged.push(conversation);
          }
        }

        return merged;
      });
      setHasMore(result.hasMore);
      setPage(nextPage);
    });
  }

  const showChatOnMobile = Boolean(selectedConversationId);
  const inboxBasePath = pathname === "/inbox" || pathname.startsWith("/inbox/");

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827]/80 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="grid min-h-[min(78vh,860px)] lg:grid-cols-[minmax(280px,360px)_1fr]">
        <section
          className={`min-h-0 border-white/10 lg:border-r ${
            showChatOnMobile ? "hidden lg:flex lg:flex-col" : "flex flex-col"
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={selectedConversationId}
            isLoading={false}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            buildHref={buildHref}
          />
        </section>

        <section
          className={`min-h-0 ${
            selectedConversationId
              ? "flex flex-col"
              : "hidden lg:flex lg:flex-col"
          } ${showChatOnMobile ? "flex flex-col" : ""}`}
        >
          {selectedConversationId ? (
            <ChatPanel
              key={selectedConversationId}
              conversationId={selectedConversationId}
              currentUserId={currentUserId}
              initialThread={initialThread}
              initialHasMore={initialThreadHasMore}
              onBack={inboxBasePath ? handleBackToList : undefined}
              onConversationUpdated={() => void refreshConversations()}
            />
          ) : (
            <div className="hidden h-full min-h-[420px] flex-col items-center justify-center px-6 text-center lg:flex">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl">
                💬
              </div>
              <h2 className="text-lg font-semibold text-white">{t("chat.selectTitle")}</h2>
              <p className="mt-2 max-w-sm text-sm text-gray-400">{t("chat.selectMessage")}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
