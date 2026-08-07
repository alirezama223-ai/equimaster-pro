"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { completePostAuthRedirect } from "@/app/lib/auth/complete-post-auth";
import { getSafeNextPath } from "@/app/lib/auth/paths";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  nextPath: string;
};

/** Resumes a pending protected destination when login already has a session. */
export default function AuthSessionResume({ nextPath }: Props) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !getSupabaseEnv().isConfigured) {
      return;
    }

    startedRef.current = true;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        startedRef.current = false;
        return;
      }

      void completePostAuthRedirect(
        supabase,
        getSafeNextPath(nextPath),
        locale
      );
    });
  }, [locale, nextPath, pathname]);

  return null;
}
