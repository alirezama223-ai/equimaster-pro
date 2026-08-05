"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/admin";
import { uploadFeedbackScreenshot } from "@/app/lib/feedback-screenshot-storage";
import {
  isFeedbackCategory,
  isFeedbackSeverity,
  isFeedbackStatus,
  validateFeedbackDescription,
  validateFeedbackScreenshot,
} from "@/app/lib/feedback/validation";
import { sanitizeAppPath } from "@/app/lib/security/path-validation";
import { checkRateLimit, rateLimitError } from "@/app/lib/security/rate-limit";
import { createClient } from "@/app/lib/supabase/server";
import type {
  AdminFeedbackFilter,
  AdminFeedbackReport,
  FeedbackReportRow,
} from "@/app/types/feedback";

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { supabase, user: null, error: error.message };
  }

  if (!user) {
    return { supabase, user: null, error: "You must be signed in to submit feedback." };
  }

  return { supabase, user, error: undefined };
}

function rowToAdminFeedbackReport(row: FeedbackReportRow): AdminFeedbackReport {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.reporter_email,
    category: row.category,
    severity: row.severity,
    description: row.description,
    pagePath: row.page_path,
    browser: row.browser,
    os: row.os,
    locale: row.locale,
    screenshotUrl: row.screenshot_url,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function submitFeedbackReport(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return { error: auth.error };
  }

  const rateLimit = checkRateLimit(`feedback:${auth.user.id}`, 10, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { error: rateLimitError(rateLimit.retryAfterMs) };
  }

  const category = String(formData.get("category") ?? "");
  const severity = String(formData.get("severity") ?? "");
  const description = String(formData.get("description") ?? "");
  const pagePathRaw = String(formData.get("pagePath") ?? "").trim();
  const browser = String(formData.get("browser") ?? "").trim().slice(0, 120);
  const os = String(formData.get("os") ?? "").trim().slice(0, 120);
  const locale = String(formData.get("locale") ?? "en").trim().slice(0, 10) || "en";
  const screenshot = formData.get("screenshot");

  if (!isFeedbackCategory(category)) {
    return { error: "Invalid feedback category." };
  }

  if (!isFeedbackSeverity(severity)) {
    return { error: "Invalid severity level." };
  }

  const descriptionError = validateFeedbackDescription(description);
  if (descriptionError) {
    return { error: descriptionError };
  }

  if (!pagePathRaw) {
    return { error: "Current page could not be detected." };
  }

  const pagePath = sanitizeAppPath(pagePathRaw);
  if (!pagePath) {
    return { error: "Invalid page path." };
  }

  if (screenshot instanceof File && screenshot.size > 0) {
    const screenshotError = validateFeedbackScreenshot(screenshot);
    if (screenshotError) {
      return { error: screenshotError };
    }
  }

  const { data: inserted, error: insertError } = await auth.supabase
    .from("feedback_reports")
    .insert({
      user_id: auth.user.id,
      reporter_email: auth.user.email ?? null,
      category,
      severity,
      description: description.trim(),
      page_path: pagePath,
      browser,
      os,
      locale,
      status: "open",
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    return { error: insertError?.message ?? "Unable to submit feedback right now." };
  }

  const report = inserted as FeedbackReportRow;

  if (screenshot instanceof File && screenshot.size > 0) {
    const uploadResult = await uploadFeedbackScreenshot(
      auth.supabase,
      auth.user.id,
      report.id,
      screenshot
    );

    if ("error" in uploadResult) {
      await auth.supabase.from("feedback_reports").delete().eq("id", report.id);
      return { error: uploadResult.error };
    }

    const { error: updateError } = await auth.supabase
      .from("feedback_reports")
      .update({
        screenshot_url: uploadResult.publicUrl,
        screenshot_storage_path: uploadResult.storagePath,
      })
      .eq("id", report.id);

    if (updateError) {
      await auth.supabase.from("feedback_reports").delete().eq("id", report.id);
      return { error: updateError.message };
    }
  }

  revalidatePath("/admin/feedback");
  return {};
}

export async function getAdminFeedbackReports(
  filter: AdminFeedbackFilter = {}
): Promise<{ reports: AdminFeedbackReport[]; error?: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { reports: [], error: auth.error ?? "Forbidden" };
  }

  let query = auth.supabase
    .from("feedback_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  }

  if (filter.category && filter.category !== "all") {
    query = query.eq("category", filter.category);
  }

  const { data, error } = await query;

  if (error) {
    return { reports: [], error: error.message };
  }

  const rows = (data ?? []) as FeedbackReportRow[];
  const normalizedQuery = filter.query?.trim().toLowerCase() ?? "";

  const reports = rows
    .map((row) => rowToAdminFeedbackReport(row))
    .filter((report) => {
      if (!normalizedQuery) {
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

      return haystack.includes(normalizedQuery);
    });

  return { reports };
}

export async function updateFeedbackReportStatus(
  reportId: string,
  status: string
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  if (!isFeedbackStatus(status)) {
    return { error: "Invalid status." };
  }

  const { error } = await auth.supabase
    .from("feedback_reports")
    .update({ status })
    .eq("id", reportId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/feedback");
  return {};
}

export async function updateFeedbackReportAdminNotes(
  reportId: string,
  adminNotes: string
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { error } = await auth.supabase
    .from("feedback_reports")
    .update({ admin_notes: adminNotes.trim() || null })
    .eq("id", reportId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/feedback");
  return {};
}
