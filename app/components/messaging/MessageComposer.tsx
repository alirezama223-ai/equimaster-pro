"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { MESSAGE_BODY_MAX } from "@/app/types/messaging";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isSending?: boolean;
};

export default function MessageComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  isSending = false,
}: Props) {
  const t = useTranslations("messaging");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && !isSending && value.trim()) {
        onSend();
      }
    }
  }

  return (
    <div className="border-t border-white/10 bg-[#0a1220]/80 p-4 sm:p-5">
      <label htmlFor="message-composer" className="sr-only">
        {t("chat.composerLabel")}
      </label>
      <textarea
        id="message-composer"
        ref={textareaRef}
        rows={3}
        value={value}
        disabled={disabled || isSending}
        maxLength={MESSAGE_BODY_MAX}
        placeholder={t("chat.composerPlaceholder")}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full resize-y rounded-2xl border border-white/10 bg-[#08111F] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {t("chat.shortcutHint")}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {value.length}/{MESSAGE_BODY_MAX}
          </span>
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || isSending || !value.trim()}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? t("chat.sending") : t("chat.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
