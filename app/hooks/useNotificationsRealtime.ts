"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";
import type { NotificationRow } from "@/app/types/user-notification";

/** Run work after the document is loaded and the browser is idle. */
export function scheduleAfterInteractive(task: () => void) {
  if (typeof window === "undefined") {
    return;
  }

  const run = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(task, { timeout: 4000 });
    } else {
      setTimeout(task, 1500);
    }
  };

  if (document.readyState === "complete") {
    run();
    return;
  }

  window.addEventListener("load", run, { once: true });
}

type Options = {
  userId: string | null;
  onChange: () => void;
  /** Defer the initial subscription until the page is loaded and idle. Default true. */
  defer?: boolean;
  /** Subscribe immediately (e.g. when the bell dropdown is open). Default false. */
  eager?: boolean;
};

type SharedSubscription = {
  userId: string;
  channel: RealtimeChannel;
  listeners: Set<() => void>;
};

let sharedSubscription: SharedSubscription | null = null;

function notifySharedListeners() {
  if (!sharedSubscription) {
    return;
  }

  for (const listener of sharedSubscription.listeners) {
    listener();
  }
}

function teardownSharedSubscription() {
  if (!sharedSubscription) {
    return;
  }

  const supabase = createClient();
  void supabase.removeChannel(sharedSubscription.channel);
  sharedSubscription = null;
}

function attachSharedListener(userId: string, listener: () => void) {
  if (sharedSubscription?.userId !== userId) {
    teardownSharedSubscription();

    if (!getSupabaseEnv().isConfigured) {
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
        notifySharedListeners
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        notifySharedListeners
      )
      .subscribe();

    sharedSubscription = {
      userId,
      channel,
      listeners: new Set(),
    };
  }

  sharedSubscription?.listeners.add(listener);
}

function detachSharedListener(userId: string, listener: () => void) {
  if (!sharedSubscription || sharedSubscription.userId !== userId) {
    return;
  }

  sharedSubscription.listeners.delete(listener);

  if (sharedSubscription.listeners.size === 0) {
    teardownSharedSubscription();
  }
}

export function useNotificationsRealtime({
  userId,
  onChange,
  defer = true,
  eager = false,
}: Options) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!userId || !getSupabaseEnv().isConfigured) {
      return;
    }

    let cancelled = false;
    const listener = () => {
      onChangeRef.current();
    };

    const subscribe = () => {
      if (cancelled) {
        return;
      }

      attachSharedListener(userId, listener);
    };

    if (eager) {
      subscribe();
    } else if (defer) {
      scheduleAfterInteractive(subscribe);
    } else {
      subscribe();
    }

    return () => {
      cancelled = true;
      detachSharedListener(userId, listener);
    };
  }, [userId, defer, eager]);
}

export type { NotificationRow };
