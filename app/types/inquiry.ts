export type InquiryStatus = "new" | "read" | "replied" | "archived";

export const INQUIRY_STATUSES: InquiryStatus[] = [
  "new",
  "read",
  "replied",
  "archived",
];

export type InquiryRow = {
  id: string;
  horse_listing_id: string;
  seller_id: string;
  buyer_id: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
};

export type SellerInquiry = InquiryRow & {
  horse_name: string;
  horse_cover_image_url: string;
  messages: InquiryMessageRow[];
};

export type BuyerInquiry = InquiryRow & {
  horse_name: string;
  horse_cover_image_url: string;
  seller_display_name: string;
  messages: InquiryMessageRow[];
};

export type InquiryMessageRow = {
  id: string;
  inquiry_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export type ConversationMessage = {
  id: string;
  sender_id: string;
  sender_role: "buyer" | "seller";
  sender_name: string;
  message: string;
  created_at: string;
};

export type InquiryFormData = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  message: string;
};

export type InquiryFormErrors = Partial<
  Record<keyof InquiryFormData, string>
>;

export const INQUIRY_NAME_MAX = 120;
export const INQUIRY_EMAIL_MAX = 254;
export const INQUIRY_PHONE_MAX = 30;
export const INQUIRY_MESSAGE_MAX = 2000;
export const INQUIRY_MESSAGE_MIN = 10;
export const REPLY_MESSAGE_MAX = 2000;
export const REPLY_MESSAGE_MIN = 1;

export function buildDefaultInquiryMessage(horseName: string): string {
  return `Hello, I am interested in ${horseName}. Is this horse still available? I would like more information.`;
}
