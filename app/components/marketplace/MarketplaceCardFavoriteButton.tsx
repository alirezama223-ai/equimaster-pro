"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { addFavorite, removeFavorite } from "@/app/actions/favorites";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import MarketplaceCardQuickAction from "@/app/components/marketplace/MarketplaceCardQuickAction";

type Props = {
  listingId: string;
  initialFavorited: boolean;
  returnPath?: string;
  disabled?: boolean;
  onChange?: (favorited: boolean) => void;
};

export default function MarketplaceCardFavoriteButton({
  listingId,
  initialFavorited,
  returnPath,
  disabled = false,
  onChange,
}: Props) {
  const t = useTranslations("favorites");
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, setIsPending] = useState(false);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isPending || disabled) return;

    setIsPending(true);

    try {
      const result = favorited
        ? await removeFavorite(listingId)
        : await addFavorite(listingId);

      if (result.unauthenticated) {
        router.push(loginRedirectPath(returnPath ?? pathname));
        return;
      }

      if (result.error) {
        return;
      }

      const nextFavorited = result.data?.favorited ?? !favorited;
      setFavorited(nextFavorited);
      onChange?.(nextFavorited);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <MarketplaceCardQuickAction
      onClick={handleClick}
      disabled={disabled || isPending}
      aria-pressed={favorited}
      aria-label={favorited ? t("button.removeAria") : t("button.saveAria")}
      title={favorited ? t("button.removeAria") : t("button.saveAria")}
      active={favorited}
      className={
        favorited
          ? "border-red-500/40 bg-red-500/10 text-red-300 [@media(hover:hover)]:hover:bg-red-500/20"
          : ""
      }
    >
      {isPending ? (
        <span className="text-sm animate-pulse" aria-hidden="true">
          {t("button.loadingIndicator")}
        </span>
      ) : (
        <span aria-hidden="true" className="text-lg leading-none">
          {favorited ? "♥" : "♡"}
        </span>
      )}
    </MarketplaceCardQuickAction>
  );
}
