"use client";

import { useEffect, useState } from "react";
import MarketplaceCardQuickAction from "@/app/components/marketplace/MarketplaceCardQuickAction";

const STORAGE_KEY = "equimaster-compare-listings";
const MAX_COMPARE = 3;

function readCompareIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeCompareIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("equimaster-compare-updated"));
}

type Props = {
  listingId: string;
  name: string;
  disabled?: boolean;
};

export default function MarketplaceCompareButton({ listingId, name, disabled = false }: Props) {
  const [selected, setSelected] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    function sync() {
      const ids = readCompareIds();
      setSelected(ids.includes(listingId));
      setLimitReached(!ids.includes(listingId) && ids.length >= MAX_COMPARE);
    }

    sync();
    window.addEventListener("equimaster-compare-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("equimaster-compare-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [listingId]);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled || !listingId) return;

    const ids = readCompareIds();
    if (ids.includes(listingId)) {
      writeCompareIds(ids.filter((id) => id !== listingId));
      return;
    }

    if (ids.length >= MAX_COMPARE) {
      setLimitReached(true);
      return;
    }

    writeCompareIds([...ids, listingId]);
  }

  const title =
    disabled
      ? "Compare unavailable"
      : limitReached && !selected
        ? `Compare list full (${MAX_COMPARE})`
        : selected
          ? "Remove from compare"
          : "Add to compare";

  return (
    <MarketplaceCardQuickAction
      onClick={handleClick}
      disabled={disabled || (limitReached && !selected)}
      aria-pressed={selected}
      aria-label={selected ? `Remove ${name} from compare` : `Compare ${name}`}
      title={title}
      active={selected}
    >
      <span aria-hidden="true" className="text-base leading-none">
        ⇄
      </span>
    </MarketplaceCardQuickAction>
  );
}
