"use client";

import { useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";
import type { NotificationRow } from "@/app/types/user-notification";

type Options = {
  userId: string | null;
  onChange: () => void;
};

export function useNotificationsRealtime({ userId, onChange }: Options) {
  useEffect(() => {
    if (!userId || !getSupabaseEnv().isConfigured) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onChange();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, onChange]);
}

export type { NotificationRow };
