"use server";

import { revalidatePath } from "next/cache";
import { attachMessagesToInquiries } from "@/app/lib/inquiry-conversation";
import { getListingCoverImageUrl } from "@/app/lib/horse-listings";
import {
  normalizeInquiryForm,
  validateInquiryForm,
} from "@/app/lib/inquiry-validation";
import { createClient } from "@/app/lib/supabase/server";
import { HorseListingRow } from "@/app/types/horse-listing";
import {
  BuyerInquiry,
  InquiryFormData,
  InquiryMessageRow,
  InquiryRow,
  InquiryStatus,
  SellerInquiry,
} from "@/app/types/inquiry";

type ListingMeta = Pick<
  HorseListingRow,
  "id" | "name" | "cover_image_url" | "image_urls" | "seller_name"
>;

type InquiryListingJoin = {
  horse_listings: ListingMeta | null;
};

function mapInquiryRow(
  row: InquiryRow &
    InquiryListingJoin & {
      messages?: InquiryMessageRow[];
    }
): SellerInquiry {
  const listing = row.horse_listings;

  const horseCover = listing
    ? getListingCoverImageUrl({
        cover_image_url: listing.cover_image_url,
        image_urls: listing.image_urls,
      } as HorseListingRow)
    : "/emi.jpg";

  return {
    id: row.id,
    horse_listing_id: row.horse_listing_id,
    seller_id: row.seller_id,
    buyer_id: row.buyer_id,
    buyer_name: row.buyer_name,
    buyer_email: row.buyer_email,
    buyer_phone: row.buyer_phone,
    message: row.message,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    horse_name: listing?.name ?? "Unknown listing",
    horse_cover_image_url: horseCover,
    messages: row.messages ?? [],
  };
}

function mapBuyerInquiryRow(
  row: InquiryRow &
    InquiryListingJoin & {
      messages?: InquiryMessageRow[];
    }
): BuyerInquiry {
  const listing = row.horse_listings;

  const horseCover = listing
    ? getListingCoverImageUrl({
        cover_image_url: listing.cover_image_url,
        image_urls: listing.image_urls,
      } as HorseListingRow)
    : "/emi.jpg";

  return {
    id: row.id,
    horse_listing_id: row.horse_listing_id,
    seller_id: row.seller_id,
    buyer_id: row.buyer_id,
    buyer_name: row.buyer_name,
    buyer_email: row.buyer_email,
    buyer_phone: row.buyer_phone,
    message: row.message,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    horse_name: listing?.name ?? "Unknown listing",
    horse_cover_image_url: horseCover,
    seller_display_name: listing?.seller_name ?? "Seller",
    messages: row.messages ?? [],
  };
}

async function fetchMessagesForInquiries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inquiryIds: string[]
): Promise<InquiryMessageRow[]> {
  if (inquiryIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("inquiry_messages")
    .select("*")
    .in("inquiry_id", inquiryIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[fetchMessagesForInquiries] failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      inquiryIds,
    });
    return [];
  }

  return (data ?? []) as InquiryMessageRow[];
}

async function fetchListingMetaForInquiries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingIds: string[]
): Promise<Map<string, ListingMeta>> {
  if (listingIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(listingIds)];

  const { data, error } = await supabase
    .from("horse_listings")
    .select("id, name, cover_image_url, image_urls, seller_name")
    .in("id", uniqueIds);

  if (error) {
    console.error("[fetchListingMetaForInquiries] failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      listingIds: uniqueIds,
    });
    return new Map();
  }

  return new Map(
    (data ?? []).map((listing) => [listing.id as string, listing as ListingMeta])
  );
}

function mapRowsToSellerInquiries(
  rows: InquiryRow[],
  listingMeta: Map<string, ListingMeta>,
  messages: InquiryMessageRow[]
): SellerInquiry[] {
  const withMessages = attachMessagesToInquiries(rows, messages);

  return withMessages.map((row) =>
    mapInquiryRow({
      ...row,
      horse_listings: listingMeta.get(row.horse_listing_id) ?? null,
      messages: row.messages,
    })
  );
}

function mapRowsToBuyerInquiries(
  rows: InquiryRow[],
  listingMeta: Map<string, ListingMeta>,
  messages: InquiryMessageRow[]
): BuyerInquiry[] {
  const withMessages = attachMessagesToInquiries(rows, messages);

  return withMessages.map((row) =>
    mapBuyerInquiryRow({
      ...row,
      horse_listings: listingMeta.get(row.horse_listing_id) ?? null,
      messages: row.messages,
    })
  );
}

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

export async function createInquiry(
  horseListingId: string,
  formData: InquiryFormData
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: "You must be signed in to contact a seller.",
      unauthenticated: true as const,
    };
  }

  const normalized = normalizeInquiryForm(formData);
  const validationErrors = validateInquiryForm(normalized);

  if (Object.keys(validationErrors).length > 0) {
    return { error: "Please review the inquiry form and try again.", validationErrors };
  }

  const { data: listing, error: listingError } = await supabase
    .from("horse_listings")
    .select("id, user_id, status, name")
    .eq("id", horseListingId)
    .eq("status", "active")
    .maybeSingle();

  if (listingError || !listing) {
    return {
      error: withDevError("This listing is not available for inquiries.", {
        message: listingError?.message,
        code: listingError?.code,
        details: listingError?.details,
        hint: listingError?.hint,
      }),
    };
  }

  const sellerId = listing.user_id as string;

  if (sellerId === user.id) {
    return { error: "You cannot send an inquiry about your own listing." };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      horse_listing_id: horseListingId,
      seller_id: sellerId,
      buyer_id: user.id,
      buyer_name: normalized.buyerName,
      buyer_email: normalized.buyerEmail,
      buyer_phone: normalized.buyerPhone || null,
      message: normalized.message,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createInquiry] insert failed", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      horseListingId,
      buyerId: user.id,
      sellerId,
    });
    return {
      error: withDevError("Unable to send your inquiry right now. Please try again.", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      }),
    };
  }

  revalidatePath("/account");
  revalidatePath(`/horse/${horseListingId}`);

  if (process.env.NODE_ENV === "development") {
    console.info("[createInquiry] saved", {
      inquiryId: data.id,
      horseListingId,
      sellerId,
      buyerId: user.id,
    });
  }

  return { data: { id: data.id as string } };
}

export async function getSellerInquiries(): Promise<{
  inquiries: SellerInquiry[];
  error?: string;
  unauthenticated?: true;
  debug?: {
    sellerId: string;
    inquiryCount: number;
  };
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { inquiries: [], unauthenticated: true };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getSellerInquiries] inquiry query failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      sellerId: user.id,
    });

    return {
      inquiries: [],
      error: withDevError("Unable to load seller inquiries.", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }),
    };
  }

  const rows = (data ?? []) as InquiryRow[];

  if (process.env.NODE_ENV === "development") {
    console.info("[getSellerInquiries] loaded", {
      sellerId: user.id,
      inquiryCount: rows.length,
      inquiryIds: rows.map((row) => row.id),
    });
  }

  const inquiryIds = rows.map((row) => row.id);
  const listingIds = rows.map((row) => row.horse_listing_id);
  const [messages, listingMeta] = await Promise.all([
    fetchMessagesForInquiries(supabase, inquiryIds),
    fetchListingMetaForInquiries(supabase, listingIds),
  ]);

  return {
    inquiries: mapRowsToSellerInquiries(rows, listingMeta, messages),
    debug:
      process.env.NODE_ENV === "development"
        ? { sellerId: user.id, inquiryCount: rows.length }
        : undefined,
  };
}

export async function getBuyerInquiries(): Promise<{
  inquiries: BuyerInquiry[];
  error?: string;
  unauthenticated?: true;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { inquiries: [], unauthenticated: true };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("buyer_id", user.id)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getBuyerInquiries] inquiry query failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      buyerId: user.id,
    });

    return {
      inquiries: [],
      error: withDevError("Unable to load your inquiries.", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }),
    };
  }

  const rows = (data ?? []) as InquiryRow[];
  const inquiryIds = rows.map((row) => row.id);
  const listingIds = rows.map((row) => row.horse_listing_id);
  const [messages, listingMeta] = await Promise.all([
    fetchMessagesForInquiries(supabase, inquiryIds),
    fetchListingMetaForInquiries(supabase, listingIds),
  ]);

  return {
    inquiries: mapRowsToBuyerInquiries(rows, listingMeta, messages),
  };
}

export async function getSellerNewInquiryCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", user.id)
    .eq("status", "new");

  if (error || count === null) {
    return 0;
  }

  return count;
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to manage inquiries." };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("id", inquiryId)
    .eq("seller_id", user.id)
    .select("id, horse_listing_id")
    .maybeSingle();

  if (error || !data) {
    return { error: "Unable to update this inquiry right now." };
  }

  revalidatePath("/account");

  if (data.horse_listing_id) {
    revalidatePath(`/horse/${data.horse_listing_id as string}`);
  }

  return { data: { id: data.id as string, status } };
}

export async function markInquiryRead(inquiryId: string) {
  return updateInquiryStatus(inquiryId, "read");
}
