import { getListingCoverImageUrl } from "@/app/lib/horse-listings";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type {
  ConversationPreview,
  ConversationRow,
  ConversationThread,
  MessageRow,
} from "@/app/types/messaging";

type ListingMeta = Pick<
  HorseListingRow,
  "id" | "name" | "slug" | "cover_image_url" | "image_urls" | "seller_name"
>;

export function mapConversationPreview(
  row: ConversationRow,
  listing: ListingMeta | null,
  currentUserId: string,
  lastMessage: MessageRow | null,
  unreadCount: number
): ConversationPreview {
  const isBuyer = row.buyer_id === currentUserId;
  const otherUserId = isBuyer ? row.seller_id : row.buyer_id;
  const otherUserName = isBuyer ? row.seller_display_name : row.buyer_display_name;

  const horseCover = listing
    ? getListingCoverImageUrl({
        cover_image_url: listing.cover_image_url,
        image_urls: listing.image_urls,
      } as HorseListingRow)
    : "/emi.jpg";

  return {
    ...row,
    horse_name: listing?.name ?? "Listing",
    horse_slug: listing?.slug ?? null,
    horse_cover_image_url: horseCover,
    other_user_id: otherUserId,
    other_user_name: otherUserName || (isBuyer ? "Seller" : "Buyer"),
    last_message_body: lastMessage?.body ?? null,
    last_message_at: lastMessage?.created_at ?? row.updated_at,
    unread_count: unreadCount,
  };
}

export function mapConversationThread(
  preview: ConversationPreview,
  messages: MessageRow[]
): ConversationThread {
  return {
    ...preview,
    messages,
  };
}

export function pickLatestMessageByConversation(
  messages: MessageRow[]
): Map<string, MessageRow> {
  const latest = new Map<string, MessageRow>();

  for (const message of messages) {
    const existing = latest.get(message.conversation_id);
    if (!existing || new Date(message.created_at) > new Date(existing.created_at)) {
      latest.set(message.conversation_id, message);
    }
  }

  return latest;
}

export function countUnreadByConversation(
  messages: MessageRow[],
  currentUserId: string
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const message of messages) {
    if (message.sender_id === currentUserId || message.read_at) {
      continue;
    }

    counts.set(message.conversation_id, (counts.get(message.conversation_id) ?? 0) + 1);
  }

  return counts;
}
