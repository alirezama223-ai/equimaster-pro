"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getConversationThread,
  markConversationRead,
  sendMessage,
} from "@/app/actions/messaging";
import MessageBubble from "@/app/components/messaging/MessageBubble";
import MessageComposer from "@/app/components/messaging/MessageComposer";
import { ChatPanelSkeleton } from "@/app/components/messaging/MessagingSkeletons";
import { getParticipantInitials } from "@/app/lib/messaging/display";
import { useConversationRealtime } from "@/app/hooks/useConversationRealtime";
import type { ConversationThread, MessageRow } from "@/app/types/messaging";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialThread: ConversationThread | null;
  initialHasMore: boolean;
  onBack?: () => void;
  onConversationUpdated?: () => void;
};

function mergeMessages(existing: MessageRow[], incoming: MessageRow[]): MessageRow[] {
  const map = new Map<string, MessageRow>();

  for (const message of existing) {
    map.set(message.id, message);
  }

  for (const message of incoming) {
    map.set(message.id, message);
  }

  return [...map.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export default function ChatPanel({
  conversationId,
  currentUserId,
  initialThread,
  initialHasMore,
  onBack,
  onConversationUpdated,
}: Props) {
  const t = useTranslations("messaging");
  const [thread, setThread] = useState<ConversationThread | null>(initialThread);
  const [messages, setMessages] = useState<MessageRow[]>(initialThread?.messages ?? []);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(!initialThread);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomAnchorRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const loadThread = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getConversationThread(conversationId);

    if (result.error || !result.thread) {
      setError(result.error ?? t("chat.loadError"));
      setIsLoading(false);
      return;
    }

    setThread(result.thread);
    setMessages(result.thread.messages);
    setHasMore(result.hasMore);
    setIsLoading(false);
    shouldStickToBottomRef.current = true;
    requestAnimationFrame(() => scrollToBottom("auto"));
    void markConversationRead(conversationId);
    onConversationUpdated?.();
  }, [conversationId, onConversationUpdated, scrollToBottom, t]);

  useEffect(() => {
    if (!initialThread) {
      void loadThread();
      return;
    }

    void markConversationRead(conversationId);
    onConversationUpdated?.();
    requestAnimationFrame(() => scrollToBottom("auto"));
  }, [conversationId, initialThread, loadThread, onConversationUpdated, scrollToBottom]);

  useEffect(() => {
    setThread(initialThread);
    setMessages(initialThread?.messages ?? []);
    setHasMore(initialHasMore);
    setDraft("");
    setError(null);
    shouldStickToBottomRef.current = true;
  }, [conversationId, initialHasMore, initialThread]);

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      scrollToBottom(messages.length > 0 ? "smooth" : "auto");
    }
  }, [messages, scrollToBottom]);

  const handleIncomingMessage = useCallback(
    (message: MessageRow) => {
      setMessages((current) => mergeMessages(current, [message]));
      shouldStickToBottomRef.current = true;

      if (message.sender_id !== currentUserId) {
        void markConversationRead(conversationId);
      }

      onConversationUpdated?.();
    },
    [conversationId, currentUserId, onConversationUpdated]
  );

  useConversationRealtime({
    conversationId,
    currentUserId,
    onMessage: handleIncomingMessage,
    onUnreadChange: onConversationUpdated,
  });

  async function handleLoadOlder() {
    if (!hasMore || isLoadingOlder || messages.length === 0) {
      return;
    }

    setIsLoadingOlder(true);
    const oldest = messages[0]?.created_at;
    const result = await getConversationThread(conversationId, { before: oldest });

    if (result.thread) {
      setMessages((current) => mergeMessages(result.thread!.messages, current));
      setHasMore(result.hasMore);
      shouldStickToBottomRef.current = false;
    }

    setIsLoadingOlder(false);
  }

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setError(null);

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: MessageRow = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: trimmed,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setMessages((current) => [...current, optimisticMessage]);
    setDraft("");
    shouldStickToBottomRef.current = true;

    const result = await sendMessage(conversationId, trimmed);

    if (result.error || !result.message) {
      setMessages((current) => current.filter((message) => message.id !== optimisticId));
      setDraft(trimmed);
      setError(result.error ?? t("chat.sendError"));
      setIsSending(false);
      return;
    }

    setMessages((current) =>
      mergeMessages(
        current.filter((message) => message.id !== optimisticId),
        [result.message!]
      )
    );
    onConversationUpdated?.();
    setIsSending(false);
  }

  if (isLoading) {
    return <ChatPanelSkeleton />;
  }

  if (!thread) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-6 text-center">
        <h2 className="text-lg font-semibold text-white">{t("chat.unavailableTitle")}</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-400">{error ?? t("chat.loadError")}</p>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mt-6 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
          >
            {t("chat.backToInbox")}
          </button>
        ) : null}
      </div>
    );
  }

  const listingHref = thread.horse_slug
    ? `/horses/${thread.horse_slug}`
    : `/horse/${thread.horse_listing_id}`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-gray-300 transition hover:bg-white/[0.05] lg:hidden"
            aria-label={t("chat.backToInbox")}
          >
            ←
          </button>
        ) : null}

        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10">
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-sm font-bold text-white">
            {getParticipantInitials(thread.other_user_name)}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{thread.other_user_name}</p>
          <Link
            href={listingHref}
            className="truncate text-sm text-blue-300 transition hover:text-blue-200"
          >
            {thread.horse_name}
          </Link>
        </div>

        <Link
          href={listingHref}
          className="relative hidden h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 sm:block"
        >
          <Image
            src={thread.horse_cover_image_url}
            alt={thread.horse_name}
            fill
            className="object-cover"
            sizes="44px"
          />
        </Link>
      </div>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
      >
        {hasMore ? (
          <div className="mb-4 flex justify-center">
            <button
              type="button"
              onClick={() => void handleLoadOlder()}
              disabled={isLoadingOlder}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/[0.05] disabled:opacity-60"
            >
              {isLoadingOlder ? t("chat.loadingOlder") : t("chat.loadOlder")}
            </button>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-white">{t("chat.emptyTitle")}</p>
            <p className="mt-2 max-w-sm text-sm text-gray-400">{t("chat.emptyMessage")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === currentUserId}
                senderName={
                  message.sender_id === currentUserId
                    ? t("chat.you")
                    : thread.other_user_name
                }
              />
            ))}
          </div>
        )}
        <div ref={bottomAnchorRef} />
      </div>

      {error ? (
        <div className="mx-4 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 sm:mx-6">
          {error}
        </div>
      ) : null}

      <MessageComposer
        value={draft}
        onChange={setDraft}
        onSend={() => void handleSend()}
        isSending={isSending}
      />
    </div>
  );
}
