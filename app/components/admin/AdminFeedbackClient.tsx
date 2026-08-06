"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  assignFeedbackReportToSelf,
  closeFeedbackReport,
  replyFeedbackReport,
} from "@/app/actions/admin-enterprise";
import {
  updateFeedbackReportAdminNotes,
  updateFeedbackReportStatus,
} from "@/app/actions/feedback";
import {
  ADMIN_BUTTON_CLASS,
  ADMIN_ERROR_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from "@/app/components/admin/admin-styles";
import type { AdminExtendedFeedbackReport } from "@/app/types/admin-panel";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_SEVERITIES,
  FEEDBACK_STATUSES,
  type FeedbackCategory,
  type FeedbackSeverity,
  type FeedbackStatus,
} from "@/app/types/feedback";

type Props = {
  reports: AdminExtendedFeedbackReport[];
};

const selectClassName =
  "rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none";

function statusBadgeClass(status: string): string {
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
  const [severityFilter, setSeverityFilter] = useState<FeedbackSeverity | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();

    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (categoryFilter !== "all" && report.category !== categoryFilter) return false;
      if (severityFilter !== "all" && report.severity !== severityFilter) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        report.description,
        report.pagePath,
        report.browser,
        report.os,
        report.userEmail ?? "",
        report.category,
        report.severity,
        report.status,
        report.adminReply ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [reports, searchInput, statusFilter, categoryFilter, severityFilter]);

  function runAction(action: () => Promise<{ error?: string }>) {
    setActionError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-3xl border border-white/10 bg-[#111827] p-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="sm:col-span-2 xl:col-span-2">
          <label htmlFor="feedback-search" className="mb-2 block text-sm text-gray-400">
            {t("search")}
          </label>
          <input
            id="feedback-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className={ADMIN_INPUT_CLASS}
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

        <div>
          <label htmlFor="feedback-severity-filter" className="mb-2 block text-sm text-gray-400">
            {t("severityFilter")}
          </label>
          <select
            id="feedback-severity-filter"
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value as FeedbackSeverity | "all")}
            className={`${selectClassName} w-full`}
          >
            <option value="all">{t("allSeverities")}</option>
            {FEEDBACK_SEVERITIES.map((severity) => (
              <option key={severity} value={severity}>
                {tFeedback(`severities.${severity}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError ? <div className={ADMIN_ERROR_CLASS}>{actionError}</div> : null}

      {filteredReports.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isExpanded = expandedId === report.id;
            const notesValue = notesDraft[report.id] ?? report.adminNotes ?? "";
            const replyValue = replyDraft[report.id] ?? report.adminReply ?? "";

            return (
              <article key={report.id} className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(report.status)}`}>
                        {tFeedback(`statuses.${report.status as FeedbackStatus}`)}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                        {tFeedback(`categories.${report.category as FeedbackCategory}`)}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                        {tFeedback(`severities.${report.severity as FeedbackSeverity}`)}
                      </span>
                      {report.assignedAdminReference ? (
                        <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs text-violet-200">
                          {t("assignedAdmin")}: {report.assignedAdminReference}
                        </span>
                      ) : null}
                    </div>

                    <p className="whitespace-pre-wrap text-white">{report.description}</p>
                    {report.adminReply ? (
                      <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        <span className="font-semibold">{t("adminReply")}: </span>
                        {report.adminReply}
                      </p>
                    ) : null}

                    <div className="grid gap-3 text-sm text-gray-400 sm:grid-cols-2 xl:grid-cols-4">
                      <p><span className="text-gray-500">{t("reporter")}: </span>{report.userEmail ?? report.userId.slice(0, 8)}</p>
                      <p><span className="text-gray-500">{t("page")}: </span>{report.pagePath}</p>
                      <p><span className="text-gray-500">{t("environment")}: </span>{report.browser} / {report.os}</p>
                      <p><span className="text-gray-500">{t("submitted")}: </span>{new Date(report.createdAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-xs lg:flex-col lg:items-stretch">
                    <select
                      value={report.status}
                      disabled={isPending}
                      onChange={(event) => runAction(() => updateFeedbackReportStatus(report.id, event.target.value))}
                      className={selectClassName}
                    >
                      {FEEDBACK_STATUSES.map((status) => (
                        <option key={status} value={status}>{tFeedback(`statuses.${status}`)}</option>
                      ))}
                    </select>
                    <button type="button" disabled={isPending} className={ADMIN_BUTTON_CLASS} onClick={() => runAction(() => assignFeedbackReportToSelf(report.id))}>{t("assignToMe")}</button>
                    <button type="button" disabled={isPending} className={ADMIN_BUTTON_CLASS} onClick={() => runAction(() => closeFeedbackReport(report.id))}>{t("closeReport")}</button>
                    <button type="button" onClick={() => setExpandedId(isExpanded ? null : report.id)} className={ADMIN_BUTTON_CLASS}>{isExpanded ? t("hideDetails") : t("viewDetails")}</button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-5 space-y-5 border-t border-white/10 pt-5">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_240px]">
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">{t("adminNotes")}</label>
                        <textarea value={notesValue} onChange={(event) => setNotesDraft((current) => ({ ...current, [report.id]: event.target.value }))} rows={4} disabled={isPending} placeholder={t("adminNotesPlaceholder")} className={ADMIN_INPUT_CLASS} />
                        <button type="button" disabled={isPending} onClick={() => runAction(() => updateFeedbackReportAdminNotes(report.id, notesValue))} className={`${ADMIN_PRIMARY_BUTTON_CLASS} mt-3`}>{t("saveNotes")}</button>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">{t("replyLabel")}</label>
                        <textarea value={replyValue} onChange={(event) => setReplyDraft((current) => ({ ...current, [report.id]: event.target.value }))} rows={4} disabled={isPending} placeholder={t("replyPlaceholder")} className={ADMIN_INPUT_CLASS} />
                        <button type="button" disabled={isPending} onClick={() => runAction(() => replyFeedbackReport(report.id, replyValue))} className={`${ADMIN_PRIMARY_BUTTON_CLASS} mt-3`}>{t("sendReply")}</button>
                      </div>

                      <div>
                        <p className="mb-2 text-sm text-gray-400">{t("screenshot")}</p>
                        {report.screenshotUrl ? (
                          <a href={report.screenshotUrl} target="_blank" rel="noopener noreferrer" className="relative block h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#08111F]">
                            <Image src={report.screenshotUrl} alt={t("screenshotAlt")} fill className="object-contain" />
                          </a>
                        ) : (
                          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-gray-500">{t("noScreenshot")}</div>
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
