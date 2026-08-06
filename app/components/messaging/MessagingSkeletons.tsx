"use client";

import { useTranslations } from "next-intl";

export function InboxListSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse gap-3 rounded-2xl border border-white/[0.06] bg-[#08111F]/70 p-4"
        >
          <div className="h-12 w-12 shrink-0 rounded-full bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/5 rounded bg-white/10" />
            <div className="h-3 w-3/5 rounded bg-white/10" />
            <div className="h-3 w-full rounded bg-white/10" />
          </div>
          <div className="hidden h-12 w-12 shrink-0 rounded-xl bg-white/10 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function ChatPanelSkeleton() {
  const t = useTranslations("messaging");

  return (
    <div className="flex h-full min-h-[420px] flex-col" aria-busy="true" aria-label={t("chat.loading")}>
      <div className="animate-pulse border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-3 w-24 rounded bg-white/10" />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-hidden p-4 sm:p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <div className="h-16 w-[70%] max-w-md rounded-2xl bg-white/10" />
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-4 sm:p-6">
        <div className="h-24 rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}
