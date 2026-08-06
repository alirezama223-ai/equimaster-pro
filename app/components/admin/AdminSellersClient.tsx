"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { reviewSellerVerification } from "@/app/actions/admin-enterprise";
import {
  ADMIN_BUTTON_CLASS,
  ADMIN_ERROR_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_TABLE_CLASS,
} from "@/app/components/admin/admin-styles";
import type { AdminSellerListItem } from "@/app/types/admin-panel";

type Props = {
  sellers: AdminSellerListItem[];
  error?: string;
};

export default function AdminSellersClient({ sellers, error }: Props) {
  const t = useTranslations("admin.sellers");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  function handleReview(userId: string, status: "approved" | "rejected" | "more_info") {
    setActionError(null);
    startTransition(async () => {
      const result = await reviewSellerVerification(userId, status, notes[userId]);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-6">
      {(error || actionError) ? <div className={ADMIN_ERROR_CLASS}>{error ?? actionError}</div> : null}

      {sellers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">{t("empty")}</div>
      ) : (
        <div className="space-y-4">
          {sellers.map((seller) => (
            <article key={seller.userId} className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="font-mono text-sm text-white">{seller.sellerReference}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${seller.sellerVerificationStatus === "pending" ? "border-amber-500/30 bg-amber-500/15 text-amber-200" : "border-blue-500/30 bg-blue-500/15 text-blue-200"}`}>
                      {t(`verificationStatus.${seller.sellerVerificationStatus}`)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{t("listingCounts", { total: seller.listingCount, active: seller.activeListingCount })} · {formatDate(seller.createdAt)}</p>
                  {seller.sellerVerificationDocuments.length > 0 ? (
                    <ul className="space-y-2">
                      {seller.sellerVerificationDocuments.map((document) => (
                        <li key={document.url}>
                          <a href={document.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300">
                            {document.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">{t("noDocuments")}</p>
                  )}
                </div>

                <div className="w-full max-w-md space-y-3">
                  <textarea
                    value={notes[seller.userId] ?? seller.sellerVerificationNotes ?? ""}
                    onChange={(event) => setNotes((current) => ({ ...current, [seller.userId]: event.target.value }))}
                    rows={3}
                    className={ADMIN_INPUT_CLASS}
                    placeholder={t("notesPlaceholder")}
                    disabled={isPending}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => handleReview(seller.userId, "approved")}>{t("actions.approve")}</button>
                    <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => handleReview(seller.userId, "rejected")}>{t("actions.reject")}</button>
                    <button type="button" className={ADMIN_BUTTON_CLASS} disabled={isPending} onClick={() => handleReview(seller.userId, "more_info")}>{t("actions.requestInfo")}</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
