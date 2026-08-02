"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import LogoutButton from "@/app/components/auth/LogoutButton";
import { checkIsCurrentUserAdmin } from "@/app/actions/admin";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

function useAuthUser() {
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

export default function NavbarAuthControls() {
  const t = useTranslations("nav");
  const { user, isAdmin, isLoading } = useAuthUser();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-16 animate-pulse rounded-xl bg-white/10 lg:h-10 lg:w-20" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Link
          href="/signup"
          className="hidden rounded-xl border border-white/20 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white hover:text-black sm:inline-flex lg:px-4 lg:py-2"
        >
          {t("signup")}
        </Link>
        <Link
          href="/login"
          className="inline-flex rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3"
        >
          {t("login")}
        </Link>
      </>
    );
  }

  return (
    <>
      {isAdmin ? (
        <Link
          href="/admin"
          className="hidden rounded-xl border border-blue-500/40 px-3 py-1.5 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/10 sm:inline-flex lg:px-4 lg:py-2"
        >
          {t("admin")}
        </Link>
      ) : null}
      <Link
        href="/account"
        className="hidden rounded-xl border border-white/20 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:inline-flex lg:px-4 lg:py-2"
      >
        {t("account")}
      </Link>
      <LogoutButton />
    </>
  );
}

export function NavbarMobileAuth() {
  const t = useTranslations("nav");
  const { user, isAdmin, isLoading } = useAuthUser();

  if (isLoading) return null;

  if (!user) {
    return (
      <>
        <Link href="/login" className="whitespace-nowrap hover:text-white transition md:hidden">
          {t("login")}
        </Link>
        <Link href="/signup" className="whitespace-nowrap hover:text-white transition sm:hidden">
          {t("signup")}
        </Link>
      </>
    );
  }

  return (
    <>
      {isAdmin ? (
        <Link href="/admin" className="whitespace-nowrap hover:text-blue-400 transition md:hidden">
          {t("admin")}
        </Link>
      ) : null}
      <Link href="/account" className="whitespace-nowrap hover:text-blue-400 transition md:hidden">
        {t("account")}
      </Link>
      <span className="whitespace-nowrap md:hidden">
        <LogoutButton />
      </span>
    </>
  );
}
