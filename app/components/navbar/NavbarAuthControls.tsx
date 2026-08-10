"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LogoutButton from "@/app/components/auth/LogoutButton";
import { useNavbarAuthUser } from "@/app/components/navbar/useNavbarAuthUser";

export default function NavbarAuthControls() {
  const t = useTranslations("nav");
  const { user, isAdmin, isLoading } = useNavbarAuthUser();

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
          className="hidden min-h-11 items-center rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black sm:inline-flex lg:px-4 lg:py-2.5"
        >
          {t("signup")}
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3"
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
          className="hidden min-h-11 items-center rounded-xl border border-blue-500/40 px-3 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/10 sm:inline-flex lg:px-4 lg:py-2.5"
        >
          {t("admin")}
        </Link>
      ) : null}
      <Link
        href="/account"
        className="hidden min-h-11 items-center rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:inline-flex lg:px-4 lg:py-2.5"
      >
        {t("account")}
      </Link>
      <LogoutButton />
    </>
  );
}

export function NavbarMobileAuth() {
  const t = useTranslations("nav");
  const { user, isAdmin, isLoading } = useNavbarAuthUser();

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
