"use client";

import type { User } from "@supabase/supabase-js";
import { checkIsCurrentUserAdmin } from "@/app/actions/admin";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

export type NavbarAuthSnapshot = {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
};

let snapshot: NavbarAuthSnapshot = {
  user: null,
  isAdmin: false,
  isLoading: getSupabaseEnv().isConfigured,
};

const listeners = new Set<() => void>();
let subscriptionInitialized = false;

let adminCheckUserId: string | null = null;
let adminCheckResult: boolean | null = null;
let adminCheckPromise: Promise<boolean> | null = null;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function setSnapshot(partial: Partial<NavbarAuthSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  emit();
}

async function resolveAdminForUser(userId: string) {
  if (adminCheckUserId === userId && adminCheckResult !== null && !adminCheckPromise) {
    setSnapshot({ isAdmin: adminCheckResult, isLoading: false });
    return;
  }

  if (adminCheckUserId === userId && adminCheckPromise) {
    await adminCheckPromise;
    return;
  }

  adminCheckUserId = userId;
  adminCheckResult = null;
  adminCheckPromise = checkIsCurrentUserAdmin();

  try {
    const admin = await adminCheckPromise;
    if (adminCheckUserId === userId) {
      adminCheckResult = admin;
      setSnapshot({ isAdmin: admin, isLoading: false });
    }
  } catch {
    if (adminCheckUserId === userId) {
      adminCheckResult = false;
      setSnapshot({ isAdmin: false, isLoading: false });
    }
  } finally {
    if (adminCheckUserId === userId) {
      adminCheckPromise = null;
    }
  }
}

async function syncUser(nextUser: User | null) {
  if (!nextUser) {
    adminCheckUserId = null;
    adminCheckResult = null;
    adminCheckPromise = null;
    setSnapshot({ user: null, isAdmin: false, isLoading: false });
    return;
  }

  const sameUser = snapshot.user?.id === nextUser.id;
  setSnapshot({ user: nextUser });

  if (sameUser && adminCheckUserId === nextUser.id && adminCheckResult !== null) {
    setSnapshot({ isLoading: false });
    return;
  }

  if (!sameUser) {
    setSnapshot({ isLoading: true, isAdmin: false });
  }

  await resolveAdminForUser(nextUser.id);
}

function ensureSubscription() {
  if (subscriptionInitialized) {
    return;
  }

  subscriptionInitialized = true;

  if (!getSupabaseEnv().isConfigured) {
    setSnapshot({ isLoading: false });
    return;
  }

  const supabase = createClient();

  void supabase.auth.getUser().then(({ data }) => {
    void syncUser(data.user);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    void syncUser(session?.user ?? null);
  });
}

export function subscribeNavbarAuth(listener: () => void): () => void {
  ensureSubscription();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNavbarAuthSnapshot(): NavbarAuthSnapshot {
  ensureSubscription();
  return snapshot;
}
