"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  updateFeedbackReportAdminNotes,
  updateFeedbackReportStatus,
} from "@/app/actions/feedback";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  type AdminFeedbackReport,
  type FeedbackCategory,
  type FeedbackStatus,
} from "@/app/types/feedback";

type Props = {
  reports: AdminFeedbackReport[];
};

const selectClassName =
  "rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none";

function statusBadgeClass(status: FeedbackStatus): string {
  switch (status) {
    case "open":
      return "bg-blue-500/15 text-blue-200 border-blue-500/30";
    case "in_progress":
      return "bg-amber-500/15 text-amber-200 border-amber-500/30";
    case "resolved":
      return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
    case "closed":
      return "bg-gray-500/15 text-gray-300 border-gray-500/30";
    default:
      return "bg-gray-500/15 text-gray-300 border-gray-500/30";
  }
}

export default function AdminFeedbackClient({ reports }: Props) {
  const t = useTranslations("admin.feedback");
  const tFeedback = useTranslations("feedback");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();

    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "all" && report.category !== categoryFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        report.description,
        report.pagePath,
        report.browser,
        report.os,
        report.userEmail ?? "",
        report.category,
        report.severity,
        report.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [reports, searchInput, statusFilter, categoryFilter]);

  function handleStatusChange(reportId: string, status: FeedbackStatus) {
    setActionError(null);

    startTransition(async () => {
      const result = await updateFeedbackReportStatus(reportId, status);

      if (result.error) {
        setActionError(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleSaveNotes(reportId: string) {
    setActionError(null);

    startTransition(async () => {
      const result = await updateFeedbackReportAdminNotes(
        reportId,
        notesDraft[reportId] ?? ""
      );

      if (result.error) {
        setActionError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-3xl border border-white/10 bg-[#111827] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="feedback-search" className="mb-2 block text-sm text-gray-400">
            {t("search")}
          </label>
          <input
            id="feedback-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="feedback-status-filter" className="mb-2 block text-sm text-gray-400">
            {t("statusFilter")}
          </label>
          <select
            id="feedback-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as FeedbackStatus | "all")}
            className={`${selectClassName} w-full`}
          >
            <option value="all">{t("allStatuses")}</option>
            {FEEDBACK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {tFeedback(`statuses.${status}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="feedback-category-filter" className="mb-2 block text-sm text-gray-400">
            {t("categoryFilter")}
          </label>
          <select
            id="feedback-category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as FeedbackCategory | "all")}
            className={`${selectClassName} w-full`}
          >
            <option value="all">{t("allCategories")}</option>
            {FEEDBACK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {tFeedback(`categories.${category}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {actionError}
        </div>
      ) : null}

      {filteredReports.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isExpanded = expandedId === report.id;
            const notesValue =
              notesDraft[report.id] ?? report.adminNotes ?? "";

            return (
              <article
                key={report.id}
                className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(report.status)}`}
                      >
                        {tFeedback(`statuses.${report.status}`)}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                        {tFeedback(`categories.${report.category}`)}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                        {tFeedback(`severities.${report.severity}`)}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-white">{report.description}</p>

                    <div className="grid gap-3 text-sm text-gray-400 sm:grid-cols-2 xl:grid-cols-4">
                      <p>
                        <span className="text-gray-500">{t("reporter")}: </span>
                        {report.userEmail ?? report.userId.slice(0, 8)}
                      </p>
                      <p>
                        <span className="text-gray-500">{t("page")}: </span>
                        {report.pagePath}
                      </p>
                      <p>
                        <span className="text-gray-500">{t("environment")}: </span>
                        {report.browser} / {report.os}
                      </p>
                      <p>
                        <span className="text-gray-500">{t("submitted")}: </span>
                        {new Date(report.createdAt).toLocaleString(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                    <label className="block text-sm text-gray-400">
                      {t("updateStatus")}
                      <select
                        value={report.status}
                        disabled={isPending}
                        onChange={(event) =>
                          handleStatusChange(report.id, event.target.value as FeedbackStatus)
                        }
                        className={`${selectClassName} mt-2 min-w-[180px]`}
                      >
                        {FEEDBACK_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {tFeedback(`statuses.${status}`)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-blue-500/40 hover:text-white"
                    >
                      {isExpanded ? t("hideDetails") : t("viewDetails")}
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-5 space-y-5 border-t border-white/10 pt-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">{t("adminNotes")}</label>
                        <textarea
                          value={notesValue}
                          onChange={(event) =>
                            setNotesDraft((current) => ({
                              ...current,
                              [report.id]: event.target.value,
                            }))
                          }
                          rows={4}
                          disabled={isPending}
                          placeholder={t("adminNotesPlaceholder")}
                          className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSaveNotes(report.id)}
                          className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                        >
                          {t("saveNotes")}
                        </button>
                      </div>

                      <div>
                        <p className="mb-2 text-sm text-gray-400">{t("screenshot")}</p>
                        {report.screenshotUrl ? (
                          <a
                            href={report.screenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#08111F]"
                          >
                            <Image
                              src={report.screenshotUrl}
                              alt={t("screenshotAlt")}
                              fill
                              className="object-contain"
                            />
                          </a>
                        ) : (
                          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-gray-500">
                            {t("noScreenshot")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
