import type { NotificationRow } from "@/app/types/user-notification";

export function getNotificationHref(notification: NotificationRow): string {
  switch (notification.type) {
    case "new_message":
      return notification.entity_id ? `/inbox/${notification.entity_id}` : "/inbox";
    case "listing_favorited":
    case "listing_view_milestone":
    case "listing_published":
    case "listing_expiring":
      return notification.entity_id
        ? `/dashboard/seller/listings/${notification.entity_id}/preview`
        : "/dashboard/seller";
    case "new_inquiry":
      return "/account";
    default:
      return "/notifications";
  }
}
