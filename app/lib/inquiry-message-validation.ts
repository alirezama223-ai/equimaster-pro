import {
  REPLY_MESSAGE_MAX,
  REPLY_MESSAGE_MIN,
} from "@/app/types/inquiry";

export function validateReplyMessage(message: string): string | null {
  const trimmed = message.trim();

  if (!trimmed) {
    return "Message cannot be empty.";
  }

  if (trimmed.length < REPLY_MESSAGE_MIN) {
    return `Message must be at least ${REPLY_MESSAGE_MIN} character.`;
  }

  if (trimmed.length > REPLY_MESSAGE_MAX) {
    return `Message must be ${REPLY_MESSAGE_MAX} characters or fewer.`;
  }

  return null;
}

export function normalizeReplyMessage(message: string): string {
  return message.trim();
}
