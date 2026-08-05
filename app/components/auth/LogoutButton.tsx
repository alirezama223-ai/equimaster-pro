"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/app/lib/supabase/client";

type Props = {
  variant?: "button" | "menu";
};

export default function LogoutButton({ variant = "button" }: Props) {
  const t = useTranslations("auth.logout");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition disabled:opacity-60"
      >
        {isLoading ? t("loading") : t("label")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-white/20 px-2.5 py-2.5 text-xs font-semibold text-white transition hover:bg-white hover:text-black disabled:opacity-60 max-[429px]:px-2 max-[429px]:text-[0.6875rem] sm:px-3 sm:text-sm lg:px-4 lg:py-2.5"
    >
      {isLoading ? t("loading") : t("label")}
    </button>
  );
}
