export type ConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  horse_listing_id: string;
  buyer_display_name: string;
  seller_display_name: string;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type ConversationPreview = ConversationRow & {
  horse_name: string;
  horse_slug: string | null;
  horse_cover_image_url: string;
  other_user_id: string;
  other_user_name: string;
  last_message_body: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export type ConversationThread = ConversationPreview & {
  messages: MessageRow[];
};

export const MESSAGE_BODY_MAX = 4000;
export const MESSAGE_BODY_MIN = 1;
export const CONVERSATIONS_PAGE_SIZE = 20;
export const MESSAGES_PAGE_SIZE = 50;
