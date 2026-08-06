"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useRef, useState, useTransition } from "react";
import VerificationStatusBadge from "@/app/components/verification/VerificationStatusBadge";
import {
  getSellerVerificationSnapshot,
  submitSellerVerification,
  uploadSellerVerificationDocument,
} from "@/app/actions/verification";
import type { SellerDocumentType, SellerVerificationSnapshot } from "@/app/types/verification";
import {
  OPTIONAL_SELLER_DOCUMENTS,
  REQUIRED_SELLER_DOCUMENTS,
  SELLER_DOCUMENT_TYPES,
} from "@/app/types/verification";

type Props = {
  initialSnapshot: SellerVerificationSnapshot;
};

export default function SellerVerificationSection({ initialSnapshot }: Props) {
  const t = useTranslations("verification.seller");
  const locale = useLocale();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  function refreshSnapshot() {
    startTransition(async () => {
      const result = await getSellerVerificationSnapshot();
      if (result.snapshot) {
        setSnapshot(result.snapshot);
      }
      router.refresh();
    });
  }

  function handleUpload(documentType: SellerDocumentType) {
    const input = fileInputs.current[documentType];
    const file = input?.files?.[0];
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadSellerVerificationDocument(documentType, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setMessage(t("uploadSuccess"));
      if (input) input.value = "";
      refreshSnapshot();
    });
  }

  function handleSubmit() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await submitSellerVerification();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setMessage(t("submitSuccess"));
      refreshSnapshot();
    });
  }

  function formatDate(value: string | null) {
    if (!value) return null;
    return new Date(value).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function documentForType(type: SellerDocumentType) {
    return snapshot.documents.find((document) => document.document_type === type);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            {t("title")}
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">{t("title")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">{t("subtitle")}</p>
        </div>
        <div className="space-y-2 text-right">
          <p className="text-xs uppercase tracking-wider text-gray-500">{t("statusLabel")}</p>
          <VerificationStatusBadge status={snapshot.status} />
          {snapshot.verifiedAt ? (
            <p className="text-xs text-emerald-300">
              {formatDate(snapshot.verifiedAt)}
            </p>
          ) : null}
        </div>
      </div>

      {snapshot.rejectionReason ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <p className="font-semibold">{t("rejectionReason")}</p>
          <p className="mt-1">{snapshot.rejectionReason}</p>
        </div>
      ) : null}

      {snapshot.notes ? (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-semibold">{t("adminNotes")}</p>
          <p className="mt-1">{snapshot.notes}</p>
        </div>
      ) : null}

      {(error || message) ? (
        <div
          className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
            error
              ? "border border-red-500/30 bg-red-500/10 text-red-200"
              : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {error ?? message}
        </div>
      ) : null}

      <div className="mt-8 space-y-8">
        <DocumentGroup
          title={t("requiredDocuments")}
          types={REQUIRED_SELLER_DOCUMENTS}
          documentForType={documentForType}
          fileInputs={fileInputs}
          isPending={isPending}
          onUpload={handleUpload}
          t={t}
        />
        <DocumentGroup
          title={t("optionalDocuments")}
          types={OPTIONAL_SELLER_DOCUMENTS}
          documentForType={documentForType}
          fileInputs={fileInputs}
          isPending={isPending}
          onUpload={handleUpload}
          t={t}
        />
      </div>

      {snapshot.status !== "verified" ? (
        <button
          type="button"
          disabled={isPending}
          onClick={handleSubmit}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
        >
          {t("submit")}
        </button>
      ) : null}
    </section>
  );
}

function DocumentGroup({
  title,
  types,
  documentForType,
  fileInputs,
  isPending,
  onUpload,
  t,
}: {
  title: string;
  types: SellerDocumentType[];
  documentForType: (type: SellerDocumentType) => SellerVerificationSnapshot["documents"][number] | undefined;
  fileInputs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  isPending: boolean;
  onUpload: (type: SellerDocumentType) => void;
  t: ReturnType<typeof useTranslations<"verification.seller">>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
      <ul className="mt-4 space-y-3">
        {types.map((type) => {
          const document = documentForType(type);
          return (
            <li
              key={type}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0f1729] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-white">{t(`documentTypes.${type}`)}</p>
                {document ? (
                  <p className="mt-1 text-sm text-gray-400">
                    {document.file_name} · {t("uploaded")}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">{t("pendingReview")}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={(node) => {
                    fileInputs.current[type] = node;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="max-w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  disabled={isPending}
                />
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onUpload(type)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-500/40"
                >
                  {document ? t("replace") : t("upload")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Keep exported document types referenced for tree-shaking safety in client bundle.
void SELLER_DOCUMENT_TYPES;
