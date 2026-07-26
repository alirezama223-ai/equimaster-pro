"use server";

import { revalidatePath } from "next/cache";
import {
  normalizeReplyMessage,
  validateReplyMessage,
} from "@/app/lib/inquiry-message-validation";
import { createClient } from "@/app/lib/supabase/server";
import { InquiryMessageRow, InquiryRow } from "@/app/types/inquiry";

function withDevError(
  message: string,
  debug?: {
    message?: string;
    code?: string;
    details?: string | null;
    hint?: string | null;
  }
) {
  if (process.env.NODE_ENV !== "development" || !debug?.message) {
    return message;
  }

  return [
    message,
    debug.message,
    debug.code ? `code: ${debug.code}` : null,
    debug.details ? `details: ${debug.details}` : null,
    debug.hint ? `hint: ${debug.hint}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

export async function sendInquiryReply(inquiryId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to send a message." };
  }

  const normalized = normalizeReplyMessage(message);
  const validationError = validateReplyMessage(normalized);

  if (validationError) {
    return { error: validationError };
  }

  const { data: inquiry, error: inquiryError } = await supabase
    .from("inquiries")
    .select("id, seller_id, buyer_id, horse_listing_id, status")
    .eq("id", inquiryId)
    .maybeSingle();

  if (inquiryError || !inquiry) {
    return { error: "This conversation could not be found." };
  }

  const row = inquiry as Pick<
    InquiryRow,
    "id" | "seller_id" | "buyer_id" | "horse_listing_id" | "status"
  >;

  if (row.status === "archived") {
    return { error: "This conversation has been archived." };
  }

  const isParticipant =
    row.seller_id === user.id || row.buyer_id === user.id;

  if (!isParticipant) {
    return { error: "You do not have permission to reply to this conversation." };
  }

  const { data, error } = await supabase
    .from("inquiry_messages")
    .insert({
      inquiry_id: inquiryId,
      sender_id: user.id,
      message: normalized,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[sendInquiryReply] insert failed", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      inquiryId,
      senderId: user.id,
    });

    return {
      error: withDevError("Unable to send your reply right now. Please try again.", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      }),
    };
  }

  revalidatePath("/account");

  if (row.horse_listing_id) {
    revalidatePath(`/horse/${row.horse_listing_id}`);
  }

  return { data: data as InquiryMessageRow };
}
