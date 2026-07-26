"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminVerificationFilter } from "@/app/lib/admin";

type Props = {
  basePath: "/admin/breeders" | "/admin/stallions" | "/admin/pedigree";
  currentFilter: AdminVerificationFilter;
};

const filters: Array<{ value: AdminVerificationFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending / Unverified" },
  { value: "verified", label: "Verified" },
];

export default function AdminVerificationFilters({ basePath, currentFilter }: Props) {
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
            {filter.label}
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
            onClick={() => run(onUnverify, `${entityLabel} marked as unverified.`)}
            className="rounded-xl border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/10 disabled:opacity-60"
          >
            Unverify
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(onVerify, `${entityLabel} verified successfully.`)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            Verify
          </button>
        )}
      </div>

      {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
