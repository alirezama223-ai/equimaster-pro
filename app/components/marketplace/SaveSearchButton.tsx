"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createSavedSearch } from "@/app/actions/saved-searches";
import type { MarketplaceSearchParams } from "@/app/types/marketplace";

type Props = {
  filters: MarketplaceSearchParams;
};

export default function SaveSearchButton({ filters }: Props) {
  const t = useTranslations("savedSearch");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await createSavedSearch(name, filters);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(t("saveSearchSuccess"));
      setName("");
      setTimeout(() => setOpen(false), 700);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          setOpen((value) => !value);
        }}
        className="inline-flex min-h-10 items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
      >
        {t("saveSearch")}
      </button>

      {open ? (
        <div className="fixed bottom-20 right-4 z-40 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#111827] p-4 shadow-2xl">
          <label className="block text-sm font-semibold text-white" htmlFor="save-search-name">
            {t("saveSearchName")}
          </label>
          <input
            id="save-search-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && name.trim()) save();
            }}
            maxLength={80}
            autoFocus
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#081223] px-3 text-sm text-white outline-none focus:border-blue-500/60"
            placeholder={t("saveSearchPlaceholder")}
          />
          {message ? <p className="mt-2 text-xs text-gray-400">{message}</p> : null}
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm text-gray-400 hover:bg-white/5">
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={!name.trim() || isPending}
              onClick={save}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {isPending ? t("savingSearch") : t("saveSearch")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
