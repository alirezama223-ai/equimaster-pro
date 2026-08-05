"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { checkIsCurrentUserAdmin } from "@/app/actions/admin";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

export function useNavbarAuthUser() {
  const isConfigured = getSupabaseEnv().isConfigured;
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(isConfigured);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const supabase = createClient();

    async function syncUser(nextUser: User | null) {
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const admin = await checkIsCurrentUserAdmin();
      setIsAdmin(admin);
      setIsLoading(false);
    }

    supabase.auth.getUser().then(({ data }) => {
      void syncUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  return { user, isAdmin, isLoading };
}
