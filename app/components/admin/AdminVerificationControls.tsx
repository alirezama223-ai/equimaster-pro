"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import type { AdminVerificationFilter } from "@/app/lib/admin";

type Props = {
  basePath: "/admin/breeders" | "/admin/stallions" | "/admin/pedigree";
  currentFilter: AdminVerificationFilter;
};

const filters: Array<{ value: AdminVerificationFilter; key: "all" | "pendingUnverified" | "verified" }> = [
  { value: "all", key: "all" },
  { value: "pending", key: "pendingUnverified" },
  { value: "verified", key: "verified" },
];

export default function AdminVerificationFilters({ basePath, currentFilter }: Props) {
  const t = useTranslations("admin.verification");

  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((filter) => {
        const active = currentFilter === filter.value;
        const href =
          filter.value === "all" ? basePath : `${basePath}?filter=${filter.value}`;

        return (
          <Link
            key={filter.value}
            href={href}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-blue-600 text-white"
                : "border border-white/10 text-gray-300 hover:border-blue-500/40 hover:text-white"
            }`}
          >
            {t(filter.key)}
          </Link>
        );
      })}
    </div>
  );
}

type ActionProps = {
  entityLabel: string;
  verified: boolean;
  onVerify: () => Promise<{ error?: string }>;
  onUnverify: () => Promise<{ error?: string }>;
};

export function AdminVerificationActions({
  entityLabel,
  verified,
  onVerify,
  onUnverify,
}: ActionProps) {
  const t = useTranslations("admin.verification");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string }>, successMessage: string) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await action();

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(successMessage);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {verified ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(onUnverify, t("unverifiedSuccess", { name: entityLabel }))}
            className="rounded-xl border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/10 disabled:opacity-60"
          >
            {t("unverify")}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(onVerify, t("verifiedSuccess", { name: entityLabel }))}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {t("verify")}
          </button>
        )}
      </div>

      {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
