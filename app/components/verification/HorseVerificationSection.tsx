"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import VerificationStatusBadge from "@/app/components/verification/VerificationStatusBadge";
import {
  getHorseVerificationSnapshot,
  submitHorseVerification,
  uploadHorseVerificationDocument,
} from "@/app/actions/verification";
import type { HorseDocumentType, HorseVerificationSnapshot } from "@/app/types/verification";
import { HORSE_DOCUMENT_TYPES } from "@/app/types/verification";
import type { HorseListingRow } from "@/app/types/horse-listing";

type Props = {
  listings: HorseListingRow[];
  initialListingId?: string;
};

export default function HorseVerificationSection({ listings, initialListingId }: Props) {
  const t = useTranslations("verification.horse");
  const locale = useLocale();
  const router = useRouter();
  const [selectedListingId, setSelectedListingId] = useState(
    initialListingId ?? listings[0]?.id ?? ""
  );
  const [snapshot, setSnapshot] = useState<HorseVerificationSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? null,
    [listings, selectedListingId]
  );

  function loadSnapshot(listingId: string) {
    if (!listingId) return;
    startTransition(async () => {
      const result = await getHorseVerificationSnapshot(listingId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSnapshot(result.snapshot);
      setError(null);
    });
  }

  function handleListingChange(listingId: string) {
    setSelectedListingId(listingId);
    setMessage(null);
    loadSnapshot(listingId);
  }

  function handleUpload(documentType: HorseDocumentType) {
    const input = fileInputs.current[documentType];
    const file = input?.files?.[0];
    if (!file || !selectedListingId) {
      setError("Choose a file to upload.");
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadHorseVerificationDocument(selectedListingId, documentType, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (input) input.value = "";
      loadSnapshot(selectedListingId);
      router.refresh();
    });
  }

  function handleSubmit() {
    if (!selectedListingId) return;
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await submitHorseVerification(selectedListingId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setMessage("Documents submitted for review.");
      loadSnapshot(selectedListingId);
      router.refresh();
    });
  }

  useEffect(() => {
    if (!selectedListingId) return;
    loadSnapshot(selectedListingId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListingId]);

  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">{t("title")}</p>
      <h2 className="mt-2 text-2xl font-black text-white">{t("title")}</h2>
      <p className="mt-2 text-sm text-gray-400">{t("subtitle")}</p>

      <label className="mt-6 block">
        <span className="text-sm font-semibold text-gray-300">{t("selectListing")}</span>
        <select
          value={selectedListingId}
          onChange={(event) => handleListingChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white"
        >
          {listings.map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.name}
            </option>
          ))}
        </select>
      </label>

      {snapshot ? (
        <div className="mt-4 flex items-center gap-3">
          <VerificationStatusBadge status={snapshot.status} />
          {snapshot.verifiedAt ? (
            <span className="text-xs text-gray-500">
              {new Date(snapshot.verifiedAt).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          ) : null}
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

      <ul className="mt-8 space-y-3">
        {HORSE_DOCUMENT_TYPES.map((type) => {
          const document = snapshot?.documents.find((item) => item.document_type === type);
          return (
            <li
              key={type}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0f1729] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-white">{t(`documentTypes.${type}`)}</p>
                {document ? (
                  <p className="mt-1 text-sm text-gray-400">{document.file_name}</p>
                ) : null}
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
                  disabled={isPending || !selectedListingId}
                  onClick={() => handleUpload(type)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-500/40"
                >
                  Upload
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {selectedListing && snapshot?.status !== "verified" ? (
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
