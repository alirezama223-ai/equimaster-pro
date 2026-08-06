export const NOTIFICATION_TYPES = [
  "new_message",
  "listing_favorited",
  "listing_view_milestone",
  "new_inquiry",
  "listing_published",
  "listing_expiring",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export const NOTIFICATIONS_PAGE_SIZE = 20;

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  new_message: "💬",
  listing_favorited: "❤️",
  listing_view_milestone: "👁️",
  new_inquiry: "📩",
  listing_published: "🚀",
  listing_expiring: "⏳",
};
