"use server";

import { revalidatePath } from "next/cache";
import { getListingCoverImageUrl } from "@/app/lib/horse-listings";
import { resolveDisplayName } from "@/app/lib/messaging/display";
import {
  countUnreadByConversation,
  mapConversationPreview,
  mapConversationThread,
  pickLatestMessageByConversation,
} from "@/app/lib/messaging/map-conversations";
import {
  normalizeMessageBody,
  validateMessageBody,
} from "@/app/lib/messaging/validation";
import { createClient } from "@/app/lib/supabase/server";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type {
  ConversationPreview,
  ConversationRow,
  ConversationThread,
  MessageRow,
} from "@/app/types/messaging";
import {
  CONVERSATIONS_PAGE_SIZE,
  MESSAGES_PAGE_SIZE,
} from "@/app/types/messaging";

type ListingMeta = Pick<
  HorseListingRow,
  "id" | "name" | "slug" | "cover_image_url" | "image_urls" | "seller_name" | "user_id" | "status"
>;

function inboxPath() {
  return "/inbox";
}

async function fetchListingMeta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingIds: string[]
): Promise<Map<string, ListingMeta>> {
  if (listingIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(listingIds)];
  const { data, error } = await supabase
    .from("horse_listings")
    .select("id, name, slug, cover_image_url, image_urls, seller_name, user_id, status")
    .in("id", uniqueIds);

  if (error) {
    console.error("[fetchListingMeta] failed", error);
    return new Map();
  }

  return new Map((data ?? []).map((listing) => [listing.id as string, listing as ListingMeta]));
}

async function fetchLatestMessagesForConversations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationIds: string[]
): Promise<MessageRow[]> {
  if (conversationIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchLatestMessagesForConversations] failed", error);
    return [];
  }

  const latest = pickLatestMessageByConversation((data ?? []) as MessageRow[]);
  return [...latest.values()];
}

async function fetchUnreadMessagesForConversations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationIds: string[],
  currentUserId: string
): Promise<MessageRow[]> {
  if (conversationIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .neq("sender_id", currentUserId)
    .is("read_at", null);

  if (error) {
    console.error("[fetchUnreadMessagesForConversations] failed", error);
    return [];
  }

  return (data ?? []) as MessageRow[];
}

function mapConversationRows(
  rows: ConversationRow[],
  listingMeta: Map<string, ListingMeta>,
  currentUserId: string,
  latestMessages: MessageRow[],
  unreadMessages: MessageRow[]
): ConversationPreview[] {
  const latestByConversation = pickLatestMessageByConversation(latestMessages);
  const unreadByConversation = countUnreadByConversation(unreadMessages, currentUserId);

  return rows.map((row) =>
    mapConversationPreview(
      row,
      listingMeta.get(row.horse_listing_id) ?? null,
      currentUserId,
      latestByConversation.get(row.id) ?? null,
      unreadByConversation.get(row.id) ?? 0
    )
  );
}

export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  if (conversationsError || !conversations?.length) {
    return 0;
  }

  const conversationIds = conversations.map((row) => row.id as string);

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error || count === null) {
    return 0;
  }

  return count;
}

export async function getConversations(page = 1, pageSize = CONVERSATIONS_PAGE_SIZE): Promise<{
  conversations: ConversationPreview[];
  hasMore: boolean;
  error?: string;
  unauthenticated?: true;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { conversations: [], hasMore: false, unauthenticated: true };
  }

  const safePage = Math.max(page, 1);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize;

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[getConversations] failed", error);
    return { conversations: [], hasMore: false, error: "Unable to load conversations." };
  }

  const fetched = (data ?? []) as ConversationRow[];
  const hasMore = fetched.length > pageSize;
  const rows = hasMore ? fetched.slice(0, pageSize) : fetched;
  const conversationIds = rows.map((row) => row.id);
  const listingIds = rows.map((row) => row.horse_listing_id);

  const [listingMeta, latestMessages, unreadMessages] = await Promise.all([
    fetchListingMeta(supabase, listingIds),
    fetchLatestMessagesForConversations(supabase, conversationIds),
    fetchUnreadMessagesForConversations(supabase, conversationIds, user.id),
  ]);

  return {
    conversations: mapConversationRows(
      rows,
      listingMeta,
      user.id,
      latestMessages,
      unreadMessages
    ),
    hasMore,
  };
}

export async function getConversationThread(
  conversationId: string,
  options?: { before?: string; limit?: number }
): Promise<{
  thread: ConversationThread | null;
  hasMore: boolean;
  error?: string;
  unauthenticated?: true;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { thread: null, hasMore: false, unauthenticated: true };
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    return { thread: null, hasMore: false, error: "Conversation not found." };
  }

  const row = conversation as ConversationRow;
  const isParticipant = row.buyer_id === user.id || row.seller_id === user.id;

  if (!isParticipant) {
    return { thread: null, hasMore: false, error: "You do not have access to this conversation." };
  }

  const limit = options?.limit ?? MESSAGES_PAGE_SIZE;
  let query = supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (options?.before) {
    query = query.lt("created_at", options.before);
  }

  const { data: messageData, error: messagesError } = await query;

  if (messagesError) {
    console.error("[getConversationThread] messages failed", messagesError);
    return { thread: null, hasMore: false, error: "Unable to load messages." };
  }

  const fetched = (messageData ?? []) as MessageRow[];
  const hasMore = fetched.length > limit;
  const messages = (hasMore ? fetched.slice(0, limit) : fetched).reverse();

  const listingMeta = await fetchListingMeta(supabase, [row.horse_listing_id]);
  const latestMessage = messages.at(-1) ?? null;
  const unreadMessages = await fetchUnreadMessagesForConversations(
    supabase,
    [conversationId],
    user.id
  );

  const preview = mapConversationPreview(
    row,
    listingMeta.get(row.horse_listing_id) ?? null,
    user.id,
    latestMessage,
    countUnreadByConversation(unreadMessages, user.id).get(conversationId) ?? 0
  );

  return {
    thread: mapConversationThread(preview, messages),
    hasMore,
  };
}

export async function findConversationForListing(horseListingId: string): Promise<{
  conversationId: string | null;
  unauthenticated?: true;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { conversationId: null, unauthenticated: true };
  }

  const { data: listing, error: listingError } = await supabase
    .from("horse_listings")
    .select("id, user_id, status, seller_name")
    .eq("id", horseListingId)
    .maybeSingle();

  if (listingError || !listing) {
    return { conversationId: null, error: "Listing not found." };
  }

  const sellerId = listing.user_id as string;

  if (sellerId === user.id) {
    return { conversationId: null, error: "You cannot message your own listing." };
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("seller_id", sellerId)
    .eq("horse_listing_id", horseListingId)
    .maybeSingle();

  if (error) {
    console.error("[findConversationForListing] failed", error);
    return { conversationId: null, error: "Unable to find conversation." };
  }

  return { conversationId: (data?.id as string | undefined) ?? null };
}

export async function getOrCreateConversation(horseListingId: string): Promise<{
  conversationId?: string;
  error?: string;
  unauthenticated?: true;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { unauthenticated: true, error: "You must be signed in to start a conversation." };
  }

  const existing = await findConversationForListing(horseListingId);
  if (existing.unauthenticated) {
    return { unauthenticated: true };
  }
  if (existing.error && !existing.conversationId) {
    return { error: existing.error };
  }
  if (existing.conversationId) {
    return { conversationId: existing.conversationId };
  }

  const { data: listing, error: listingError } = await supabase
    .from("horse_listings")
    .select("id, user_id, status, seller_name")
    .eq("id", horseListingId)
    .eq("status", "active")
    .maybeSingle();

  if (listingError || !listing) {
    return { error: "This listing is not available for messaging." };
  }

  const sellerId = listing.user_id as string;

  if (sellerId === user.id) {
    return { error: "You cannot message your own listing." };
  }

  const buyerDisplayName = resolveDisplayName(
    user.user_metadata,
    user.email,
    "Buyer"
  );
  const sellerDisplayName = (listing.seller_name as string | null)?.trim() || "Seller";

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      buyer_id: user.id,
      seller_id: sellerId,
      horse_listing_id: horseListingId,
      buyer_display_name: buyerDisplayName,
      seller_display_name: sellerDisplayName,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const retry = await findConversationForListing(horseListingId);
      if (retry.conversationId) {
        return { conversationId: retry.conversationId };
      }
    }

    console.error("[getOrCreateConversation] insert failed", error);
    return { error: "Unable to start conversation right now." };
  }

  revalidatePath(inboxPath());

  return { conversationId: data.id as string };
}

export async function sendMessage(conversationId: string, body: string): Promise<{
  message?: MessageRow;
  error?: string;
  unauthenticated?: true;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { unauthenticated: true, error: "You must be signed in to send a message." };
  }

  const normalized = normalizeMessageBody(body);
  const validationError = validateMessageBody(normalized);

  if (validationError) {
    return { error: validationError };
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, horse_listing_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    return { error: "Conversation not found." };
  }

  const row = conversation as ConversationRow;
  const isParticipant = row.buyer_id === user.id || row.seller_id === user.id;

  if (!isParticipant) {
    return { error: "You do not have permission to send messages here." };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: normalized,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[sendMessage] insert failed", error);
    return { error: "Unable to send message right now." };
  }

  revalidatePath(inboxPath());
  revalidatePath(`${inboxPath()}/${conversationId}`);

  return { message: data as MessageRow };
}

export async function markConversationRead(conversationId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    return { error: "Conversation not found." };
  }

  const row = conversation as ConversationRow;
  const isParticipant = row.buyer_id === user.id || row.seller_id === user.id;

  if (!isParticipant) {
    return { error: "Forbidden." };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("messages")
    .update({ read_at: now })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[markConversationRead] failed", error);
    return { error: "Unable to mark messages as read." };
  }

  revalidatePath(inboxPath());
  return {};
}

export async function getSellerConversationPreviews(limit = 8): Promise<{
  conversations: ConversationPreview[];
  error?: string;
  unauthenticated?: true;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { conversations: [], unauthenticated: true };
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("seller_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getSellerConversationPreviews] failed", error);
    return { conversations: [], error: "Unable to load messages." };
  }

  const rows = (data ?? []) as ConversationRow[];
  const conversationIds = rows.map((row) => row.id);
  const listingIds = rows.map((row) => row.horse_listing_id);

  const [listingMeta, latestMessages, unreadMessages] = await Promise.all([
    fetchListingMeta(supabase, listingIds),
    fetchLatestMessagesForConversations(supabase, conversationIds),
    fetchUnreadMessagesForConversations(supabase, conversationIds, user.id),
  ]);

  return {
    conversations: mapConversationRows(
      rows,
      listingMeta,
      user.id,
      latestMessages,
      unreadMessages
    ),
  };
}

export async function getSellerConversationsWithMessages(): Promise<{
  conversations: ConversationPreview[];
  messages: MessageRow[];
  error?: string;
  unauthenticated?: true;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { conversations: [], messages: [], unauthenticated: true };
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("seller_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getSellerConversationsWithMessages] failed", error);
    return { conversations: [], messages: [], error: "Unable to load conversations." };
  }

  const rows = (data ?? []) as ConversationRow[];
  const conversationIds = rows.map((row) => row.id);
  const listingIds = rows.map((row) => row.horse_listing_id);

  let messages: MessageRow[] = [];
  if (conversationIds.length > 0) {
    const { data: messageData, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("[getSellerConversationsWithMessages] messages failed", messagesError);
    } else {
      messages = (messageData ?? []) as MessageRow[];
    }
  }

  const [listingMeta, latestMessages, unreadMessages] = await Promise.all([
    fetchListingMeta(supabase, listingIds),
    fetchLatestMessagesForConversations(supabase, conversationIds),
    fetchUnreadMessagesForConversations(supabase, conversationIds, user.id),
  ]);

  return {
    conversations: mapConversationRows(
      rows,
      listingMeta,
      user.id,
      latestMessages,
      unreadMessages
    ),
    messages,
  };
}