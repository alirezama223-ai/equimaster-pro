"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { getMarketplaceListingsByIds } from "@/app/actions/marketplace";

const STORAGE_KEY = "equimaster-compare-listings";
const EVENT_NAME = "equimaster-compare-updated";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string").slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export default function MarketplaceCompareBar() {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const storedIds = readIds();
      if (cancelled) return;
      setIds(storedIds);

      if (storedIds.length === 0) return;

      // Demo data and listings can be recreated, which changes UUIDs. Validate
      // persisted compare IDs against the current active marketplace records so
      // stale localStorage entries never send the user to an empty compare page.
      const { listings } = await getMarketplaceListingsByIds(storedIds);
      if (cancelled) return;

      const validIds = storedIds.filter((id) => listings.some((listing) => listing.id === id));
      if (validIds.length !== storedIds.length) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validIds));
        setIds(validIds);
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      }
    };

    void sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const compareHref = useMemo(() => {
    const params = new URLSearchParams({ ids: ids.join(",") });
    return `/horses/compare?${params.toString()}`;
  }, [ids]);

  function clear() {
    writeIds([]);
    setIds([]);
  }

  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4 sm:bottom-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-blue-400/30 bg-[#101a2d]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Compare horses</p>
          <p className="mt-1 text-xs text-gray-400">
            {ids.length} of 3 selected{ids.length === 1 ? " · select one more to compare" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={ids.length < 2}
            onClick={() => router.push(compareHref)}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Compare {ids.length} horses ↔
          </button>
        </div>
      </div>
    </div>
  );
}
