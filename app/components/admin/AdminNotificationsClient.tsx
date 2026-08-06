"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { broadcastAdminNotification } from "@/app/actions/admin-enterprise";
import {
  ADMIN_ERROR_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_SUCCESS_CLASS,
} from "@/app/components/admin/admin-styles";
import type { BroadcastTarget } from "@/app/types/admin-panel";

export default function AdminNotificationsClient() {
  const t = useTranslations("admin.notifications");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<BroadcastTarget>("all");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await broadcastAdminNotification({ title, body, target });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(t("sent", { count: result.count ?? 0 }));
      setTitle("");
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error ? <div className={ADMIN_ERROR_CLASS}>{error}</div> : null}
      {success ? <div className={ADMIN_SUCCESS_CLASS}>{success}</div> : null}

      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white">{t("targetLabel")}</span>
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value as BroadcastTarget)}
            className={`${ADMIN_SELECT_CLASS} w-full`}
            disabled={isPending}
          >
            <option value="all">{t("targets.all")}</option>
            <option value="breeders">{t("targets.breeders")}</option>
            <option value="sellers">{t("targets.sellers")}</option>
            <option value="buyers">{t("targets.buyers")}</option>
            <option value="admins">{t("targets.admins")}</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white">{t("titleLabel")}</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={ADMIN_INPUT_CLASS}
            required
            disabled={isPending}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white">{t("bodyLabel")}</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            className={ADMIN_INPUT_CLASS}
            required
            disabled={isPending}
          />
        </label>
      </div>

      <button type="submit" disabled={isPending} className={ADMIN_PRIMARY_BUTTON_CLASS}>
        {isPending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
