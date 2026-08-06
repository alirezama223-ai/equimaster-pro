"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getOrCreateConversation } from "@/app/actions/messaging";
import { loginRedirectPath } from "@/app/lib/auth/paths";

type Props = {
  horseListingId: string;
  returnPath: string;
  isAuthenticated: boolean;
  triggerClassName?: string;
  fullWidth?: boolean;
};

export default function StartConversationButton({
  horseListingId,
  returnPath,
  isAuthenticated,
  triggerClassName = "",
  fullWidth = false,
}: Props) {
  const t = useTranslations("horse");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (!isAuthenticated) {
      router.push(loginRedirectPath(returnPath));
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await getOrCreateConversation(horseListingId);

      if (result.unauthenticated) {
        router.push(loginRedirectPath(returnPath));
        return;
      }

      if (result.error || !result.conversationId) {
        return;
      }

      router.push(`/inbox/${result.conversationId}`);
    } finally {
      setIsLoading(false);
    }
  }

  const defaultClass = fullWidth
    ? "w-full min-h-12 rounded-xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white transition [@media(hover:hover)]:hover:bg-blue-500 disabled:opacity-60"
    : "rounded-xl bg-blue-600 px-8 py-4 text-white font-semibold transition hover:bg-blue-500 disabled:opacity-60";

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isLoading}
      className={`${defaultClass} ${triggerClassName}`.trim()}
    >
      {isLoading ? t("conversation.starting") : t("conversation.startConversation")}
    </button>
  );
}
