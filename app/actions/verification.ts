"use server";

import { revalidatePath } from "next/cache";
import { formatOwnerReference, requireAdmin } from "@/app/lib/admin";
import { createClient } from "@/app/lib/supabase/server";
import {
  createVerificationSignedUrl,
  deleteVerificationStorageObject,
  uploadVerificationDocument,
} from "@/app/lib/verification-storage";
import type { SellerVerificationStatus } from "@/app/types/profile";
import type {
  AdminHorseVerificationQueueItem,
  AdminVerificationQueueItem,
  AdminVerificationReviewAction,
  HorseDocumentType,
  HorseVerificationSnapshot,
  HorseVerificationStatus,
  SellerDocumentType,
  SellerVerificationSnapshot,
  VerificationAuditLogRow,
  VerificationDocumentRow,
} from "@/app/types/verification";
import {
  HORSE_DOCUMENT_TYPES,
  REQUIRED_SELLER_DOCUMENTS,
  SELLER_DOCUMENT_TYPES,
} from "@/app/types/verification";

const REVALIDATE_PATHS = [
  "/account",
  "/account/verification",
  "/admin/sellers",
  "/admin/verification",
  "/marketplace",
  "/dashboard/seller",
  "/messages",
];

function revalidateVerificationPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

function mapDocumentRow(row: Record<string, unknown>): VerificationDocumentRow {
  return {
    id: String(row.id),
    owner_user_id: String(row.owner_user_id),
    horse_listing_id: row.horse_listing_id ? String(row.horse_listing_id) : null,
    subject_type: row.subject_type === "horse" ? "horse" : "seller",
    document_type: String(row.document_type) as VerificationDocumentRow["document_type"],
    storage_path: String(row.storage_path),
    file_name: String(row.file_name),
    mime_type: row.mime_type ? String(row.mime_type) : null,
    file_size: row.file_size == null ? null : Number(row.file_size),
    status:
      row.status === "approved" || row.status === "rejected" ? row.status : "pending",
    notes: row.notes ? String(row.notes) : null,
    uploaded_at: String(row.uploaded_at ?? row.created_at),
    verified_by: row.verified_by ? String(row.verified_by) : null,
    verified_at: row.verified_at ? String(row.verified_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapAuditRow(row: Record<string, unknown>): VerificationAuditLogRow {
  return {
    id: String(row.id),
    actor_user_id: row.actor_user_id ? String(row.actor_user_id) : null,
    subject_user_id: row.subject_user_id ? String(row.subject_user_id) : null,
    horse_listing_id: row.horse_listing_id ? String(row.horse_listing_id) : null,
    document_id: row.document_id ? String(row.document_id) : null,
    subject_type:
      row.subject_type === "horse" || row.subject_type === "document"
        ? row.subject_type
        : "seller",
    action: String(row.action),
    previous_status: row.previous_status ? String(row.previous_status) : null,
    new_status: row.new_status ? String(row.new_status) : null,
    reason: row.reason ? String(row.reason) : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    created_at: String(row.created_at),
  };
}

async function insertAuditLog(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>["supabase"]>,
  entry: Omit<VerificationAuditLogRow, "id" | "created_at" | "metadata"> & {
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from("verification_audit_log").insert({
    actor_user_id: entry.actor_user_id,
    subject_user_id: entry.subject_user_id,
    horse_listing_id: entry.horse_listing_id,
    document_id: entry.document_id,
    subject_type: entry.subject_type,
    action: entry.action,
    previous_status: entry.previous_status,
    new_status: entry.new_status,
    reason: entry.reason,
    metadata: entry.metadata ?? {},
  });
}

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in.", user: null, supabase: null };
  }

  return { error: null, user, supabase };
}

export async function getSellerVerificationSnapshot(): Promise<{
  snapshot: SellerVerificationSnapshot | null;
  error?: string;
}> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { snapshot: null, error: auth.error ?? "Forbidden" };
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from("profiles")
    .select(
      "seller_verification_status, seller_verified, phone_verified, seller_rejection_reason, seller_verification_notes, seller_verified_at"
    )
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    return { snapshot: null, error: profileError.message };
  }

  const { data: documents, error: documentsError } = await auth.supabase
    .from("verification_documents")
    .select("*")
    .eq("owner_user_id", auth.user.id)
    .eq("subject_type", "seller")
    .order("uploaded_at", { ascending: false });

  if (documentsError) {
    return { snapshot: null, error: documentsError.message };
  }

  const status = (profile?.seller_verification_status ??
    "unverified") as SellerVerificationStatus;

  return {
    snapshot: {
      status,
      sellerVerified: Boolean(profile?.seller_verified),
      phoneVerified: Boolean(profile?.phone_verified),
      rejectionReason: (profile?.seller_rejection_reason as string | null) ?? null,
      notes: (profile?.seller_verification_notes as string | null) ?? null,
      verifiedAt: (profile?.seller_verified_at as string | null) ?? null,
      documents: (documents ?? []).map((row) => mapDocumentRow(row as Record<string, unknown>)),
    },
  };
}

export async function uploadSellerVerificationDocument(
  documentType: SellerDocumentType,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  if (!SELLER_DOCUMENT_TYPES.includes(documentType)) {
    return { error: "Invalid document type." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a document to upload." };
  }

  const upload = await uploadVerificationDocument(
    auth.supabase,
    auth.user.id,
    "seller",
    documentType,
    file
  );

  if ("error" in upload) {
    return { error: upload.error };
  }

  const { data: existing } = await auth.supabase
    .from("verification_documents")
    .select("id, storage_path")
    .eq("owner_user_id", auth.user.id)
    .eq("subject_type", "seller")
    .eq("document_type", documentType)
    .maybeSingle();

  if (existing?.storage_path && existing.storage_path !== upload.storagePath) {
    await deleteVerificationStorageObject(auth.supabase, existing.storage_path);
  }

  const payload = {
    owner_user_id: auth.user.id,
    horse_listing_id: null,
    subject_type: "seller" as const,
    document_type: documentType,
    storage_path: upload.storagePath,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    status: "pending" as const,
    notes: null,
    uploaded_at: new Date().toISOString(),
    verified_by: null,
    verified_at: null,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing?.id
    ? await auth.supabase.from("verification_documents").update(payload).eq("id", existing.id)
    : await auth.supabase.from("verification_documents").insert(payload);

  if (error) {
    return { error: error.message };
  }

  if (documentType === "phone_verification") {
    await auth.supabase
      .from("profiles")
      .update({ phone_verified: false })
      .eq("user_id", auth.user.id);
  }

  await auth.supabase
    .from("profiles")
    .update({
      seller_verification_status: "pending",
      seller_rejection_reason: null,
      seller_verification_notes: null,
    })
    .eq("user_id", auth.user.id);

  revalidateVerificationPaths();
  return { success: true };
}

export async function submitSellerVerification(): Promise<
  { success: true } | { error: string }
> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { data: documents, error } = await auth.supabase
    .from("verification_documents")
    .select("document_type")
    .eq("owner_user_id", auth.user.id)
    .eq("subject_type", "seller");

  if (error) {
    return { error: error.message };
  }

  const uploadedTypes = new Set((documents ?? []).map((row) => String(row.document_type)));
  const missing = REQUIRED_SELLER_DOCUMENTS.filter((type) => !uploadedTypes.has(type));

  if (missing.length > 0) {
    return { error: "Upload all required documents before submitting." };
  }

  const { error: updateError } = await auth.supabase
    .from("profiles")
    .update({
      seller_verification_status: "pending",
      seller_rejection_reason: null,
    })
    .eq("user_id", auth.user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidateVerificationPaths();
  return { success: true };
}

export async function getHorseVerificationSnapshot(
  listingId: string
): Promise<{ snapshot: HorseVerificationSnapshot | null; error?: string }> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { snapshot: null, error: auth.error ?? "Forbidden" };
  }

  const { data: listing, error: listingError } = await auth.supabase
    .from("horse_listings")
    .select("id, name, user_id, horse_verification_status, verified, horse_verified_at")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError) {
    return { snapshot: null, error: listingError.message };
  }

  if (!listing || listing.user_id !== auth.user.id) {
    return { snapshot: null, error: "Listing not found." };
  }

  const { data: documents, error: documentsError } = await auth.supabase
    .from("verification_documents")
    .select("*")
    .eq("horse_listing_id", listingId)
    .eq("subject_type", "horse")
    .order("uploaded_at", { ascending: false });

  if (documentsError) {
    return { snapshot: null, error: documentsError.message };
  }

  return {
    snapshot: {
      listingId: String(listing.id),
      listingName: String(listing.name),
      status: (listing.horse_verification_status ?? "unverified") as HorseVerificationStatus,
      horseVerified: Boolean(listing.verified),
      verifiedAt: (listing.horse_verified_at as string | null) ?? null,
      documents: (documents ?? []).map((row) => mapDocumentRow(row as Record<string, unknown>)),
    },
  };
}

export async function uploadHorseVerificationDocument(
  listingId: string,
  documentType: HorseDocumentType,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  if (!HORSE_DOCUMENT_TYPES.includes(documentType)) {
    return { error: "Invalid document type." };
  }

  const { data: listing, error: listingError } = await auth.supabase
    .from("horse_listings")
    .select("id, user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError) {
    return { error: listingError.message };
  }

  if (!listing || listing.user_id !== auth.user.id) {
    return { error: "Listing not found." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a document to upload." };
  }

  const upload = await uploadVerificationDocument(
    auth.supabase,
    auth.user.id,
    "horse",
    documentType,
    file,
    listingId
  );

  if ("error" in upload) {
    return { error: upload.error };
  }

  const { data: existing } = await auth.supabase
    .from("verification_documents")
    .select("id, storage_path")
    .eq("horse_listing_id", listingId)
    .eq("subject_type", "horse")
    .eq("document_type", documentType)
    .maybeSingle();

  if (existing?.storage_path && existing.storage_path !== upload.storagePath) {
    await deleteVerificationStorageObject(auth.supabase, existing.storage_path);
  }

  const payload = {
    owner_user_id: auth.user.id,
    horse_listing_id: listingId,
    subject_type: "horse" as const,
    document_type: documentType,
    storage_path: upload.storagePath,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    status: "pending" as const,
    notes: null,
    uploaded_at: new Date().toISOString(),
    verified_by: null,
    verified_at: null,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing?.id
    ? await auth.supabase.from("verification_documents").update(payload).eq("id", existing.id)
    : await auth.supabase.from("verification_documents").insert(payload);

  if (error) {
    return { error: error.message };
  }

  await auth.supabase
    .from("horse_listings")
    .update({ horse_verification_status: "documents_submitted" })
    .eq("id", listingId);

  revalidateVerificationPaths();
  return { success: true };
}

export async function submitHorseVerification(
  listingId: string
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { data: listing, error: listingError } = await auth.supabase
    .from("horse_listings")
    .select("id, user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError) {
    return { error: listingError.message };
  }

  if (!listing || listing.user_id !== auth.user.id) {
    return { error: "Listing not found." };
  }

  const { count, error } = await auth.supabase
    .from("verification_documents")
    .select("id", { count: "exact", head: true })
    .eq("horse_listing_id", listingId)
    .eq("subject_type", "horse");

  if (error) {
    return { error: error.message };
  }

  if (!count) {
    return { error: "Upload at least one horse document before submitting." };
  }

  const { error: updateError } = await auth.supabase
    .from("horse_listings")
    .update({ horse_verification_status: "documents_submitted" })
    .eq("id", listingId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidateVerificationPaths();
  return { success: true };
}

export async function getVerificationDocumentSignedUrl(
  documentId: string
): Promise<{ signedUrl: string } | { error: string }> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.user || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const adminAuth = await requireAdmin();
  const isAdmin = !adminAuth.error && Boolean(adminAuth.supabase);

  const { data: document, error } = await auth.supabase
    .from("verification_documents")
    .select("storage_path, owner_user_id")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!document) {
    return { error: "Document not found." };
  }

  if (document.owner_user_id !== auth.user.id && !isAdmin) {
    return { error: "You do not have permission to view this document." };
  }

  const client = isAdmin && adminAuth.supabase ? adminAuth.supabase : auth.supabase;
  return createVerificationSignedUrl(client, String(document.storage_path), 600);
}

export async function getAdminVerificationQueue(filters?: {
  status?: SellerVerificationStatus | "all";
  subject?: "seller" | "horse" | "all";
}): Promise<{
  sellers: AdminVerificationQueueItem[];
  horses: AdminHorseVerificationQueueItem[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { sellers: [], horses: [], error: auth.error ?? "Forbidden" };
  }

  const statusFilter = filters?.status ?? "all";
  const subject = filters?.subject ?? "all";

  let sellers: AdminVerificationQueueItem[] = [];
  let horses: AdminHorseVerificationQueueItem[] = [];

  if (subject === "all" || subject === "seller") {
    let sellerQuery = auth.supabase
      .from("profiles")
      .select(
        "user_id, seller_verification_status, seller_verified, phone_verified, seller_rejection_reason, seller_verification_notes, seller_verified_at, created_at, updated_at"
      )
      .order("updated_at", { ascending: false });

    if (statusFilter !== "all") {
      sellerQuery = sellerQuery.eq("seller_verification_status", statusFilter);
    } else {
      sellerQuery = sellerQuery.neq("seller_verification_status", "unverified");
    }

    const { data, error } = await sellerQuery.limit(100);
    if (error) {
      return { sellers: [], horses: [], error: error.message };
    }

    const userIds = (data ?? []).map((row) => String(row.user_id));
    const { data: docCounts } = await auth.supabase
      .from("verification_documents")
      .select("owner_user_id, status")
      .eq("subject_type", "seller")
      .in("owner_user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    const countMap = new Map<string, { total: number; pending: number }>();
    for (const row of docCounts ?? []) {
      const key = String(row.owner_user_id);
      const current = countMap.get(key) ?? { total: 0, pending: 0 };
      current.total += 1;
      if (row.status === "pending") current.pending += 1;
      countMap.set(key, current);
    }

    sellers = (data ?? []).map((profile) => {
      const userId = String(profile.user_id);
      const counts = countMap.get(userId) ?? { total: 0, pending: 0 };
      return {
        userId,
        sellerReference: formatOwnerReference(userId),
        status: (profile.seller_verification_status ?? "unverified") as SellerVerificationStatus,
        sellerVerified: Boolean(profile.seller_verified),
        phoneVerified: Boolean(profile.phone_verified),
        rejectionReason: (profile.seller_rejection_reason as string | null) ?? null,
        notes: (profile.seller_verification_notes as string | null) ?? null,
        verifiedAt: (profile.seller_verified_at as string | null) ?? null,
        documentCount: counts.total,
        pendingDocumentCount: counts.pending,
        createdAt: String(profile.created_at),
        updatedAt: String(profile.updated_at),
      };
    });
  }

  if (subject === "all" || subject === "horse") {
    let horseQuery = auth.supabase
      .from("horse_listings")
      .select("id, name, user_id, horse_verification_status, verified, horse_verified_at, updated_at")
      .order("updated_at", { ascending: false });

    if (statusFilter !== "all" && statusFilter !== "verified" && statusFilter !== "rejected") {
      horseQuery = horseQuery.eq("horse_verification_status", statusFilter);
    } else if (statusFilter === "verified") {
      horseQuery = horseQuery.eq("horse_verification_status", "verified");
    } else {
      horseQuery = horseQuery.neq("horse_verification_status", "unverified");
    }

    const { data, error } = await horseQuery.limit(100);
    if (error) {
      return { sellers, horses: [], error: error.message };
    }

    const listingIds = (data ?? []).map((row) => String(row.id));
    const { data: docCounts } = await auth.supabase
      .from("verification_documents")
      .select("horse_listing_id, status")
      .eq("subject_type", "horse")
      .in(
        "horse_listing_id",
        listingIds.length > 0 ? listingIds : ["00000000-0000-0000-0000-000000000000"]
      );

    const countMap = new Map<string, { total: number; pending: number }>();
    for (const row of docCounts ?? []) {
      const key = String(row.horse_listing_id);
      const current = countMap.get(key) ?? { total: 0, pending: 0 };
      current.total += 1;
      if (row.status === "pending") current.pending += 1;
      countMap.set(key, current);
    }

    horses = (data ?? []).map((listing) => {
      const listingId = String(listing.id);
      const counts = countMap.get(listingId) ?? { total: 0, pending: 0 };
      return {
        listingId,
        listingName: String(listing.name),
        sellerReference: formatOwnerReference(String(listing.user_id)),
        ownerUserId: String(listing.user_id),
        status: (listing.horse_verification_status ?? "unverified") as HorseVerificationStatus,
        horseVerified: Boolean(listing.verified),
        verifiedAt: (listing.horse_verified_at as string | null) ?? null,
        documentCount: counts.total,
        pendingDocumentCount: counts.pending,
        updatedAt: String(listing.updated_at),
      };
    });
  }

  return { sellers, horses };
}

export async function getAdminVerificationDocuments(filters: {
  userId?: string;
  listingId?: string;
}): Promise<{ documents: VerificationDocumentRow[]; error?: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { documents: [], error: auth.error ?? "Forbidden" };
  }

  let query = auth.supabase.from("verification_documents").select("*").order("uploaded_at", {
    ascending: false,
  });

  if (filters.userId) {
    query = query.eq("owner_user_id", filters.userId).eq("subject_type", "seller");
  }

  if (filters.listingId) {
    query = query.eq("horse_listing_id", filters.listingId).eq("subject_type", "horse");
  }

  const { data, error } = await query;
  if (error) {
    return { documents: [], error: error.message };
  }

  return {
    documents: (data ?? []).map((row) => mapDocumentRow(row as Record<string, unknown>)),
  };
}

export async function reviewSellerVerificationAdmin(
  userId: string,
  action: AdminVerificationReviewAction,
  reason?: string
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from("profiles")
    .select("seller_verification_status, phone_verified")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  if (!profile) {
    return { error: "Seller not found." };
  }

  const previousStatus = String(profile.seller_verification_status ?? "unverified");
  let newStatus: SellerVerificationStatus = previousStatus as SellerVerificationStatus;
  const patch: Record<string, unknown> = {
    seller_verification_notes: reason?.trim() || null,
  };

  if (action === "approve") {
    newStatus = "verified";
    patch.seller_verification_status = "verified";
    patch.seller_verified_by = auth.user.id;
    patch.seller_verified_at = new Date().toISOString();
    patch.seller_rejection_reason = null;
    patch.phone_verified = true;
  } else if (action === "reject") {
    newStatus = "rejected";
    patch.seller_verification_status = "rejected";
    patch.seller_rejection_reason = reason?.trim() || "Verification rejected.";
    patch.seller_verified_by = null;
    patch.seller_verified_at = null;
  } else {
    newStatus = "unverified";
    patch.seller_verification_status = "unverified";
    patch.seller_rejection_reason = null;
  }

  const { error } = await auth.supabase.from("profiles").update(patch).eq("user_id", userId);
  if (error) {
    return { error: error.message };
  }

  await insertAuditLog(auth.supabase, {
    actor_user_id: auth.user.id,
    subject_user_id: userId,
    horse_listing_id: null,
    document_id: null,
    subject_type: "seller",
    action: `seller_${action}`,
    previous_status: previousStatus,
    new_status: newStatus,
    reason: reason?.trim() || null,
  });

  revalidateVerificationPaths();
  return { success: true };
}

export async function reviewHorseVerificationAdmin(
  listingId: string,
  action: AdminVerificationReviewAction,
  reason?: string
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { data: listing, error: listingError } = await auth.supabase
    .from("horse_listings")
    .select("horse_verification_status, user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError) {
    return { error: listingError.message };
  }

  if (!listing) {
    return { error: "Listing not found." };
  }

  const previousStatus = String(listing.horse_verification_status ?? "unverified");
  let newStatus: HorseVerificationStatus = previousStatus as HorseVerificationStatus;
  const patch: Record<string, unknown> = {};

  if (action === "approve") {
    newStatus = "verified";
    patch.horse_verification_status = "verified";
    patch.horse_verified_by = auth.user.id;
    patch.horse_verified_at = new Date().toISOString();
    patch.rejection_reason = null;
  } else if (action === "reject") {
    newStatus = "documents_submitted";
    patch.horse_verification_status = "documents_submitted";
    patch.rejection_reason = reason?.trim() || "Horse verification rejected.";
    patch.horse_verified_by = null;
    patch.horse_verified_at = null;
  } else {
    newStatus = "unverified";
    patch.horse_verification_status = "unverified";
    patch.rejection_reason = null;
  }

  const { error } = await auth.supabase.from("horse_listings").update(patch).eq("id", listingId);
  if (error) {
    return { error: error.message };
  }

  await insertAuditLog(auth.supabase, {
    actor_user_id: auth.user.id,
    subject_user_id: String(listing.user_id),
    horse_listing_id: listingId,
    document_id: null,
    subject_type: "horse",
    action: `horse_${action}`,
    previous_status: previousStatus,
    new_status: newStatus,
    reason: reason?.trim() || null,
  });

  revalidateVerificationPaths();
  return { success: true };
}

export async function reviewVerificationDocumentAdmin(
  documentId: string,
  status: "approved" | "rejected",
  notes?: string
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { data: document, error: documentError } = await auth.supabase
    .from("verification_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    return { error: documentError.message };
  }

  if (!document) {
    return { error: "Document not found." };
  }

  const previousStatus = String(document.status ?? "pending");
  const { error } = await auth.supabase
    .from("verification_documents")
    .update({
      status,
      notes: notes?.trim() || null,
      verified_by: auth.user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (error) {
    return { error: error.message };
  }

  await insertAuditLog(auth.supabase, {
    actor_user_id: auth.user.id,
    subject_user_id: String(document.owner_user_id),
    horse_listing_id: document.horse_listing_id ? String(document.horse_listing_id) : null,
    document_id: documentId,
    subject_type: "document",
    action: `document_${status}`,
    previous_status: previousStatus,
    new_status: status,
    reason: notes?.trim() || null,
    metadata: { document_type: document.document_type },
  });

  revalidateVerificationPaths();
  return { success: true };
}

export async function getVerificationAuditLog(limit = 50): Promise<{
  entries: VerificationAuditLogRow[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { entries: [], error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("verification_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { entries: [], error: error.message };
  }

  return {
    entries: (data ?? []).map((row) => mapAuditRow(row as Record<string, unknown>)),
  };
}

export async function getPublicSellerVerification(userId: string): Promise<{
  sellerVerified: boolean;
  verifiedAt: string | null;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("seller_verified, seller_verified_at")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    sellerVerified: Boolean(data?.seller_verified),
    verifiedAt: (data?.seller_verified_at as string | null) ?? null,
  };
}
