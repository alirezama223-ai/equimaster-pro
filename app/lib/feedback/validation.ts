import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_SEVERITIES,
  FEEDBACK_STATUSES,
  type FeedbackCategory,
  type FeedbackSeverity,
  type FeedbackStatus,
} from "@/app/types/feedback";

export const MAX_FEEDBACK_DESCRIPTION_LENGTH = 4000;
export const MAX_FEEDBACK_SCREENSHOT_BYTES = 5 * 1024 * 1024;

const ACCEPTED_SCREENSHOT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isFeedbackCategory(value: string): value is FeedbackCategory {
  return FEEDBACK_CATEGORIES.includes(value as FeedbackCategory);
}

export function isFeedbackSeverity(value: string): value is FeedbackSeverity {
  return FEEDBACK_SEVERITIES.includes(value as FeedbackSeverity);
}

export function isFeedbackStatus(value: string): value is FeedbackStatus {
  return FEEDBACK_STATUSES.includes(value as FeedbackStatus);
}

export function validateFeedbackDescription(description: string): string | null {
  const trimmed = description.trim();

  if (!trimmed) {
    return "Description is required.";
  }

  if (trimmed.length > MAX_FEEDBACK_DESCRIPTION_LENGTH) {
    return `Description must be ${MAX_FEEDBACK_DESCRIPTION_LENGTH} characters or fewer.`;
  }

  return null;
}

export function validateFeedbackScreenshot(file: File): string | null {
  if (!ACCEPTED_SCREENSHOT_TYPES.has(file.type)) {
    return "Screenshot must be a JPEG, PNG, or WebP image.";
  }

  if (file.size > MAX_FEEDBACK_SCREENSHOT_BYTES) {
    return "Screenshot must be 5 MB or smaller.";
  }

  return null;
}
