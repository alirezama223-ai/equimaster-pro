import {
  ConversationMessage,
  InquiryMessageRow,
  InquiryRow,
} from "@/app/types/inquiry";

export function buildConversationMessages(
  inquiry: Pick<
    InquiryRow,
    "id" | "buyer_id" | "buyer_name" | "seller_id" | "message" | "created_at"
  >,
  messages: InquiryMessageRow[],
  sellerName: string
): ConversationMessage[] {
  const initialMessage: ConversationMessage = {
    id: `initial-${inquiry.id}`,
    sender_id: inquiry.buyer_id ?? "",
    sender_role: "buyer",
    sender_name: inquiry.buyer_name,
    message: inquiry.message,
    created_at: inquiry.created_at,
  };

  const threadMessages = messages.map((entry) => ({
    id: entry.id,
    sender_id: entry.sender_id,
    sender_role:
      entry.sender_id === inquiry.seller_id
        ? ("seller" as const)
        : ("buyer" as const),
    sender_name:
      entry.sender_id === inquiry.seller_id ? sellerName : inquiry.buyer_name,
    message: entry.message,
    created_at: entry.created_at,
  }));

  return [initialMessage, ...threadMessages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function groupMessagesByInquiryId(
  messages: InquiryMessageRow[]
): Record<string, InquiryMessageRow[]> {
  return messages.reduce<Record<string, InquiryMessageRow[]>>((groups, message) => {
    if (!groups[message.inquiry_id]) {
      groups[message.inquiry_id] = [];
    }
    groups[message.inquiry_id].push(message);
    return groups;
  }, {});
}

export function attachMessagesToInquiries<T extends InquiryRow>(
  inquiries: T[],
  messages: InquiryMessageRow[]
): Array<T & { messages: InquiryMessageRow[] }> {
  const grouped = groupMessagesByInquiryId(messages);

  return inquiries.map((inquiry) => ({
    ...inquiry,
    messages: grouped[inquiry.id] ?? [],
  }));
}
