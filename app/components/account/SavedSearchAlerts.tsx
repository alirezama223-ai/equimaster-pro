"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markSavedSearchChecked } from "@/app/actions/saved-search-alerts";

type Props = {
  searchId: string;
  href: string;
  name: string;
  count: number;
  newMatchesLabel: string;
};

export default function SavedSearchAlerts({
  searchId,
  href,
  name,
  count,
  newMatchesLabel,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const openSearch = () => {
    startTransition(async () => {
      await markSavedSearchChecked(searchId);
      router.push(href);
    });
  };

  return (
    <button
      type="button"
      onClick={openSearch}
      disabled={isPending}
      className="block w-full text-left rounded-2xl border border-white/10 bg-[#0B1422] px-4 py-4 transition hover:border-blue-500/50 hover:bg-[#101B2D] disabled:opacity-60"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-white">{name}</p>
        {count > 0 ? (
          <span className="shrink-0 rounded-full bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 text-xs font-semibold text-blue-200">
            {count} {newMatchesLabel}
          </span>
        ) : null}
      </div>
    </button>
  );
}
