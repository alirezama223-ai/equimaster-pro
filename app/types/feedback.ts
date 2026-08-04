export const FEEDBACK_CATEGORIES = ["bug", "suggestion", "feature_request"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type FeedbackSeverity = (typeof FEEDBACK_SEVERITIES)[number];

export const FEEDBACK_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export type FeedbackReportRow = {
  id: string;
  user_id: string;
  reporter_email: string | null;
  category: FeedbackCategory;
  severity: FeedbackSeverity;
  description: string;
  page_path: string;
  browser: string;
  os: string;
  locale: string;
  screenshot_url: string | null;
  screenshot_storage_path: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminFeedbackReport = {
  id: string;
  userId: string;
  userEmail: string | null;
  category: FeedbackCategory;
  severity: FeedbackSeverity;
  description: string;
  pagePath: string;
  browser: string;
  os: string;
  locale: string;
  screenshotUrl: string | null;
  status: FeedbackStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminFeedbackFilter = {
  status?: FeedbackStatus | "all";
  category?: FeedbackCategory | "all";
  query?: string;
};
