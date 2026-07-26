"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { addFavorite, removeFavorite } from "@/app/actions/favorites";

type Props = {
  listingId: string;
  initialFavorited: boolean;
  returnPath?: string;
  variant?: "icon" | "button";
  className?: string;
  onChange?: (favorited: boolean) => void;
};

export default function FavoriteButton({
  listingId,
  initialFavorited,
  returnPath,
  variant = "icon",
  className = "",
  onChange,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, setIsPending] = useState(false);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isPending) return;

    setIsPending(true);

    try {
      const result = favorited
        ? await removeFavorite(listingId)
        : await addFavorite(listingId);

      if (result.unauthenticated) {
        const next = encodeURIComponent(returnPath ?? pathname);
        router.push(`/login?next=${next}`);
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

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={favorited}
        aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
        className={`w-full py-4 rounded-xl border font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${
          favorited
            ? "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            : "border-white/30 text-white hover:bg-white/10"
        } ${className}`}
      >
        {isPending
          ? "Saving..."
          : favorited
            ? "♥ Saved to Favorites"
            : "♡ Save Horse"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      className={`absolute top-4 right-4 w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition text-xl disabled:opacity-60 disabled:cursor-not-allowed ${
        favorited
          ? "bg-red-500 text-white"
          : "bg-black/50 text-white hover:bg-red-500"
      } ${className}`}
    >
      {isPending ? (
        <span className="text-sm animate-pulse">…</span>
      ) : favorited ? (
        "♥"
      ) : (
        "♡"
      )}
    </button>
  );
}
