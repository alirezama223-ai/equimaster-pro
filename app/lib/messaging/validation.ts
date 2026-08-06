import { MESSAGE_BODY_MAX, MESSAGE_BODY_MIN } from "@/app/types/messaging";

export function normalizeMessageBody(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

export function validateMessageBody(value: string): string | null {
  const normalized = normalizeMessageBody(value);

  if (normalized.length < MESSAGE_BODY_MIN) {
    return "Message cannot be empty.";
  }

  if (normalized.length > MESSAGE_BODY_MAX) {
    return `Message must be at most ${MESSAGE_BODY_MAX} characters.`;
  }

  return null;
}
