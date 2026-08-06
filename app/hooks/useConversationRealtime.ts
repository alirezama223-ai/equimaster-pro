"use client";

import { useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";
import type { MessageRow } from "@/app/types/messaging";

type Options = {
  conversationId: string | null;
  currentUserId: string;
  onMessage: (message: MessageRow) => void;
  onUnreadChange?: () => void;
};

export function useConversationRealtime({
  conversationId,
  currentUserId,
  onMessage,
  onUnreadChange,
}: Options) {
  useEffect(() => {
    if (!conversationId || !getSupabaseEnv().isConfigured) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as MessageRow;
          onMessage(message);

          if (message.sender_id !== currentUserId) {
            onUnreadChange?.();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          onUnreadChange?.();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, onMessage, onUnreadChange]);
}

export function useUnreadMessagesRealtime(onUnreadChange: () => void) {
  useEffect(() => {
    if (!getSupabaseEnv().isConfigured) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel("messages:unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          onUnreadChange();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          onUnreadChange();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onUnreadChange]);
}
