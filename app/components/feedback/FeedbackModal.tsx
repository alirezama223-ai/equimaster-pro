"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitFeedbackReport } from "@/app/actions/feedback";
import { useFocusTrap } from "@/app/hooks/useFocusTrap";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_SEVERITIES,
  type FeedbackCategory,
  type FeedbackSeverity,
} from "@/app/types/feedback";

type Props = {
  pagePath: string;
  browser: string;
  os: string;
  locale: string;
  onClose: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none";

const labelClassName = "mb-2 block text-sm font-medium text-gray-300";

export default function FeedbackModal({ pagePath, browser, os, locale, onClose }: Props) {
  const t = useTranslations("feedback");
  const tCommon = useTranslations("common");
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [severity, setSeverity] = useState<FeedbackSeverity>("medium");
  const [description, setDescription] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onClose]);

  useEffect(() => {
    if (!screenshotFile) {
      setScreenshotPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(screenshotFile);
    setScreenshotPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [screenshotFile]);

  function handleScreenshotChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setScreenshotFile(file);
    setError(null);
  }

  function handleRemoveScreenshot() {
    setScreenshotFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("category", category);
    formData.set("severity", severity);
    formData.set("description", description);
    formData.set("pagePath", pagePath);
    formData.set("browser", browser);
    formData.set("os", os);
    formData.set("locale", locale);

    if (screenshotFile) {
      formData.set("screenshot", screenshotFile);
    }

    startTransition(async () => {
      const result = await submitFeedbackReport(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setIsSuccess(true);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={isPending ? undefined : onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#111C2E] shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[4px] text-blue-500">
                {t("modal.eyebrow")}
              </p>
              <h2 id="feedback-modal-title" className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                {isSuccess ? t("modal.successTitle") : t("modal.title")}
              </h2>
              <p className="mt-3 text-gray-400">
                {isSuccess ? t("modal.successMessage") : t("modal.subtitle")}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              {t("modal.close")}
            </button>
          </div>

          {isSuccess ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {t("modal.done")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="feedback-category" className={labelClassName}>
                    {t("modal.category")}
                  </label>
                  <select
                    id="feedback-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
                    className={inputClassName}
                    disabled={isPending}
                  >
                    {FEEDBACK_CATEGORIES.map((value) => (
                      <option key={value} value={value}>
                        {t(`categories.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="feedback-severity" className={labelClassName}>
                    {t("modal.severity")}
                  </label>
                  <select
                    id="feedback-severity"
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value as FeedbackSeverity)}
                    className={inputClassName}
                    disabled={isPending}
                  >
                    {FEEDBACK_SEVERITIES.map((value) => (
                      <option key={value} value={value}>
                        {t(`severities.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="feedback-description" className={labelClassName}>
                  {t("modal.description")}
                </label>
                <textarea
                  id="feedback-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t("modal.descriptionPlaceholder")}
                  rows={5}
                  required
                  disabled={isPending}
                  className={`${inputClassName} resize-y min-h-[120px]`}
                />
              </div>

              <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#08111F]/70 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{t("modal.page")}</p>
                  <p className="mt-1 break-all text-sm text-gray-200">{pagePath}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{t("modal.language")}</p>
                  <p className="mt-1 text-sm text-gray-200">{locale.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{t("modal.browser")}</p>
                  <p className="mt-1 text-sm text-gray-200">{browser}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{t("modal.os")}</p>
                  <p className="mt-1 text-sm text-gray-200">{os}</p>
                </div>
              </div>

              <div>
                <label htmlFor="feedback-screenshot" className={labelClassName}>
                  {t("modal.screenshot")}
                </label>
                <p className="mb-3 text-sm text-gray-500">{t("modal.screenshotHint")}</p>
                <input
                  ref={fileInputRef}
                  id="feedback-screenshot"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleScreenshotChange}
                  disabled={isPending}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500"
                />

                {screenshotPreviewUrl ? (
                  <div className="mt-4 space-y-3">
                    <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#08111F]">
                      <Image
                        src={screenshotPreviewUrl}
                        alt={t("modal.screenshotPreviewAlt")}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      disabled={isPending}
                      className="text-sm font-medium text-red-300 transition hover:text-red-200 disabled:opacity-50"
                    >
                      {t("modal.removeScreenshot")}
                    </button>
                  </div>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {isPending ? t("modal.submitting") : t("modal.submit")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
