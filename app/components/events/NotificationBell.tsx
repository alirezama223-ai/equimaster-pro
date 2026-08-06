"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { getUnreadMessageCount } from "@/app/actions/messaging";
import { useUnreadMessagesRealtime } from "@/app/hooks/useConversationRealtime";

export default function NotificationBell() {
  const t = useTranslations("messaging");
  const [count, setCount] = useState(0);

  const refreshCount = useCallback(async () => {
    const nextCount = await getUnreadMessageCount();
    setCount(nextCount);
  }, []);

  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

  useUnreadMessagesRealtime(() => {
    void refreshCount();
  });

  const ariaLabel =
    count > 0 ? t("bell.ariaLabelWithCount", { count }) : t("bell.ariaLabel");

  return (
    <Link
      href="/inbox"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-gray-300 transition hover:border-blue-500/40 hover:text-white"
      aria-label={ariaLabel}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M15 17H9l1-2h4l1 2Z" />
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
