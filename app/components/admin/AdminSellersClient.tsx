"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { setAdminSellerVerified } from "@/app/actions/admin-panel";
import type { AdminSellerListItem } from "@/app/types/admin-panel";

type Props = {
  sellers: AdminSellerListItem[];
  error?: string;
};

const buttonClassName =
  "rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-blue-500/40 disabled:opacity-50";

export default function AdminSellersClient({ sellers, error }: Props) {
  const t = useTranslations("admin.sellers");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleVerification(userId: string, sellerVerified: boolean) {
    setActionError(null);
    startTransition(async () => {
      const result = await setAdminSellerVerified(userId, sellerVerified);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {error || actionError ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200">
          {error ?? actionError}
        </div>
      ) : null}

      {sellers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-[#0B1424] text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-4">{t("columns.seller")}</th>
                <th className="px-4 py-4">{t("columns.status")}</th>
                <th className="px-4 py-4">{t("columns.listings")}</th>
                <th className="px-4 py-4">{t("columns.views")}</th>
                <th className="px-4 py-4">{t("columns.joined")}</th>
                <th className="px-4 py-4">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-[#111827]">
              {sellers.map((seller) => (
                <tr key={seller.userId}>
                  <td className="px-4 py-4 font-mono text-xs text-gray-300">{seller.sellerReference}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        seller.sellerVerified
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                          : "border-amber-500/30 bg-amber-500/15 text-amber-200"
                      }`}
                    >
                      {seller.sellerVerified ? t("verified") : t("pending")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-300">
                    {t("listingCounts", {
                      total: seller.listingCount,
                      active: seller.activeListingCount,
                    })}
                  </td>
                  <td className="px-4 py-4 text-gray-300">{seller.totalViews}</td>
                  <td className="px-4 py-4 text-gray-400">{formatDate(seller.createdAt)}</td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className={buttonClassName}
                      disabled={isPending}
                      onClick={() => handleVerification(seller.userId, !seller.sellerVerified)}
                    >
                      {seller.sellerVerified ? t("actions.unverify") : t("actions.verify")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
