"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  getAdminVerificationDocuments,
  getAdminVerificationQueue,
  getVerificationAuditLog,
  getVerificationDocumentSignedUrl,
  reviewHorseVerificationAdmin,
  reviewSellerVerificationAdmin,
  reviewVerificationDocumentAdmin,
} from "@/app/actions/verification";
import {
  ADMIN_BUTTON_CLASS,
  ADMIN_ERROR_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_TABLE_CLASS,
} from "@/app/components/admin/admin-styles";
import VerificationStatusBadge from "@/app/components/verification/VerificationStatusBadge";
import type {
  AdminHorseVerificationQueueItem,
  AdminVerificationQueueItem,
  AdminVerificationReviewAction,
  SellerVerificationStatus,
  VerificationAuditLogRow,
  VerificationDocumentRow,
} from "@/app/types/verification";

type Props = {
  initialSellers: AdminVerificationQueueItem[];
  initialHorses: AdminHorseVerificationQueueItem[];
  initialAudit: VerificationAuditLogRow[];
  error?: string;
};

export default function AdminVerificationClient({
  initialSellers,
  initialHorses,
  initialAudit,
  error,
}: Props) {
  const t = useTranslations("verification.admin");
  const locale = useLocale();
  const router = useRouter();
  const [sellers, setSellers] = useState(initialSellers);
  const [horses, setHorses] = useState(initialHorses);
  const [audit, setAudit] = useState(initialAudit);
  const [subjectFilter, setSubjectFilter] = useState<"all" | "seller" | "horse">("all");
  const [statusFilter, setStatusFilter] = useState<SellerVerificationStatus | "all">("pending");
  const [activeTab, setActiveTab] = useState<"queue" | "audit">("queue");
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(
    initialSellers[0]?.userId ?? null
  );
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    initialHorses[0]?.listingId ?? null
  );
  const [documents, setDocuments] = useState<VerificationDocumentRow[]>([]);
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (activeTab !== "queue") return;

    startTransition(async () => {
      if (selectedSellerId && (subjectFilter === "all" || subjectFilter === "seller")) {
        const result = await getAdminVerificationDocuments({ userId: selectedSellerId });
        if (!result.error) setDocuments(result.documents);
      } else if (selectedListingId && (subjectFilter === "all" || subjectFilter === "horse")) {
        const result = await getAdminVerificationDocuments({ listingId: selectedListingId });
        if (!result.error) setDocuments(result.documents);
      } else {
        setDocuments([]);
      }
    });
  }, [activeTab, selectedSellerId, selectedListingId, subjectFilter]);

  function refreshAll() {
    startTransition(async () => {
      const [queueResult, auditResult] = await Promise.all([
        getAdminVerificationQueue({ status: statusFilter, subject: subjectFilter }),
        getVerificationAuditLog(),
      ]);

      if (!queueResult.error) {
        setSellers(queueResult.sellers);
        setHorses(queueResult.horses);
      }

      if (!auditResult.error) {
        setAudit(auditResult.entries);
      }

      router.refresh();
    });
  }

  function runReview(
    type: "seller" | "horse",
    id: string,
    action: AdminVerificationReviewAction
  ) {
    setActionError(null);
    startTransition(async () => {
      const result =
        type === "seller"
          ? await reviewSellerVerificationAdmin(id, action, notes)
          : await reviewHorseVerificationAdmin(id, action, notes);

      if ("error" in result) {
        setActionError(result.error);
        return;
      }

      setNotes("");
      refreshAll();
    });
  }

  function openDocument(documentId: string) {
    startTransition(async () => {
      const result = await getVerificationDocumentSignedUrl(documentId);
      if ("error" in result) {
        setActionError(result.error);
        return;
      }
      window.open(result.signedUrl, "_blank", "noopener,noreferrer");
    });
  }

  function reviewDocument(documentId: string, status: "approved" | "rejected") {
    startTransition(async () => {
      const result = await reviewVerificationDocumentAdmin(documentId, status, notes);
      if ("error" in result) {
        setActionError(result.error);
        return;
      }
      refreshAll();
    });
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      {(error || actionError) ? <div className={ADMIN_ERROR_CLASS}>{error ?? actionError}</div> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${ADMIN_BUTTON_CLASS} ${activeTab === "queue" ? "bg-blue-600" : ""}`}
          onClick={() => setActiveTab("queue")}
        >
          {t("tabs.queue")}
        </button>
        <button
          type="button"
          className={`${ADMIN_BUTTON_CLASS} ${activeTab === "audit" ? "bg-blue-600" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          {t("tabs.audit")}
        </button>
      </div>

      {activeTab === "queue" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-gray-400">{t("filters.subject")}</span>
              <select
                value={subjectFilter}
                onChange={(event) => {
                  setSubjectFilter(event.target.value as "all" | "seller" | "horse");
                  refreshAll();
                }}
                className={ADMIN_INPUT_CLASS}
              >
                <option value="all">{t("filters.all")}</option>
                <option value="seller">{t("filters.seller")}</option>
                <option value="horse">{t("filters.horse")}</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-gray-400">{t("filters.status")}</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as SellerVerificationStatus | "all");
                  refreshAll();
                }}
                className={ADMIN_INPUT_CLASS}
              >
                <option value="all">{t("filters.all")}</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="unverified">Unverified</option>
              </select>
            </label>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {(subjectFilter === "all" || subjectFilter === "seller") && (
              <QueuePanel
                title={t("filters.seller")}
                emptyLabel={t("noDocuments")}
                items={sellers.map((seller) => ({
                  id: seller.userId,
                  label: seller.sellerReference,
                  status: seller.status,
                  meta: `${seller.documentCount} docs · ${formatDate(seller.updatedAt)}`,
                  selected: selectedSellerId === seller.userId,
                  onSelect: () => setSelectedSellerId(seller.userId),
                }))}
              />
            )}

            {(subjectFilter === "all" || subjectFilter === "horse") && (
              <QueuePanel
                title={t("filters.horse")}
                emptyLabel={t("noDocuments")}
                items={horses.map((horse) => ({
                  id: horse.listingId,
                  label: horse.listingName,
                  status: horse.status,
                  meta: `${horse.sellerReference} · ${horse.documentCount} docs`,
                  selected: selectedListingId === horse.listingId,
                  onSelect: () => setSelectedListingId(horse.listingId),
                }))}
              />
            )}
          </div>

          <section className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6">
            <h3 className="text-lg font-bold text-white">Documents</h3>
            {documents.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">{t("noDocuments")}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className={ADMIN_TABLE_CLASS}>
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">File</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => (
                      <tr key={document.id} className="border-t border-white/5">
                        <td className="px-4 py-3">{document.document_type}</td>
                        <td className="px-4 py-3">{document.file_name}</td>
                        <td className="px-4 py-3">
                          {t(`documentStatus.${document.status}`)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={ADMIN_BUTTON_CLASS}
                              disabled={isPending}
                              onClick={() => openDocument(document.id)}
                            >
                              {t("preview")}
                            </button>
                            <button
                              type="button"
                              className={ADMIN_BUTTON_CLASS}
                              disabled={isPending}
                              onClick={() => reviewDocument(document.id, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className={ADMIN_BUTTON_CLASS}
                              disabled={isPending}
                              onClick={() => reviewDocument(document.id, "rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className={`${ADMIN_INPUT_CLASS} mt-6`}
              placeholder={t("reasonPlaceholder")}
              disabled={isPending}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSellerId ? (
                <>
                  <button
                    type="button"
                    className={ADMIN_BUTTON_CLASS}
                    disabled={isPending}
                    onClick={() => runReview("seller", selectedSellerId, "approve")}
                  >
                    {t("actions.approve")} seller
                  </button>
                  <button
                    type="button"
                    className={ADMIN_BUTTON_CLASS}
                    disabled={isPending}
                    onClick={() => runReview("seller", selectedSellerId, "reject")}
                  >
                    {t("actions.reject")} seller
                  </button>
                  <button
                    type="button"
                    className={ADMIN_BUTTON_CLASS}
                    disabled={isPending}
                    onClick={() => runReview("seller", selectedSellerId, "request_info")}
                  >
                    {t("actions.requestInfo")}
                  </button>
                </>
              ) : null}

              {selectedListingId ? (
                <>
                  <button
                    type="button"
                    className={ADMIN_BUTTON_CLASS}
                    disabled={isPending}
                    onClick={() => runReview("horse", selectedListingId, "approve")}
                  >
                    {t("actions.approve")} horse
                  </button>
                  <button
                    type="button"
                    className={ADMIN_BUTTON_CLASS}
                    disabled={isPending}
                    onClick={() => runReview("horse", selectedListingId, "reject")}
                  >
                    {t("actions.reject")} horse
                  </button>
                </>
              ) : null}
            </div>
          </section>
        </>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#111827]">
          {audit.length === 0 ? (
            <p className="px-6 py-12 text-center text-gray-500">{t("auditEmpty")}</p>
          ) : (
            <table className={ADMIN_TABLE_CLASS}>
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id} className="border-t border-white/5">
                    <td className="px-4 py-3">{formatDate(entry.created_at)}</td>
                    <td className="px-4 py-3">{entry.action}</td>
                    <td className="px-4 py-3">{entry.subject_type}</td>
                    <td className="px-4 py-3">
                      {entry.previous_status ?? "—"} → {entry.new_status ?? "—"}
                    </td>
                    <td className="px-4 py-3">{entry.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function QueuePanel({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: Array<{
    id: string;
    label: string;
    status: string;
    meta: string;
    selected: boolean;
    onSelect: () => void;
  }>;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={item.onSelect}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  item.selected
                    ? "border-blue-500/40 bg-blue-500/10"
                    : "border-white/10 bg-[#0f1729] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-white">{item.label}</span>
                  <VerificationStatusBadge status={item.status as never} />
                </div>
                <p className="mt-1 text-sm text-gray-400">{item.meta}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
