"use server";

import { revalidatePath } from "next/cache";
import {
  buildListingImageFields,
  copyListingImagesForDuplicate,
  isListingImageStoragePathOwnedByUser,
  removeAllListingImagesForListing,
  removeListingImagesFromStorage,
  serializedImagesToUploaded,
  type SerializedUploadedListingImage,
} from "@/app/lib/horse-image-storage";
import {
  buildCreateListingInput,
  buildListingFieldUpdates,
} from "@/app/lib/horse-listings";
import {
  normalizeListingLocationFields,
  resolveListingCoordinates,
} from "@/app/lib/geocoding/resolve-listing-coordinates";
import { buildListingSlug } from "@/app/lib/marketplace/slug";
import { getPublicListingPath, getListingEditPath, MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";
import { refreshListingPublicSnapshots } from "@/app/lib/marketplace/listing-display";
import { syncListingPedigreeFromRow } from "@/app/lib/pedigree-sync";
import {
  removeAllListingVideosForListing,
  removeListingVideoFromStorage,
  copyListingVideoForDuplicate,
} from "@/app/lib/horse-video-storage";
import { assertCanActivateListing } from "@/app/lib/subscriptions/queries";
import { createClient } from "@/app/lib/supabase/server";
import { LISTING_QUOTA_ERROR_CODE } from "@/app/types/subscription";
import { isValidListingSlug } from "@/app/lib/security/path-validation";
import { getClientIp } from "@/app/lib/security/request-context";
import { checkRateLimit } from "@/app/lib/security/rate-limit";
import { HorseListingRow, type ListingStatus } from "@/app/types/horse-listing";
import { ListingFormData, MAX_LISTING_IMAGES, MAX_LISTING_IMAGE_BYTES } from "@/app/types/listing";
import type { SellerListingStats } from "@/app/types/marketplace";

type CreateListingPayload = {
  formData: ListingFormData;
  imageCount: number;
  hasVideoFile: boolean;
  publish?: boolean;
};

type UpdateImagePayload = {
  isCover: boolean;
  storagePath: string;
  publicUrl: string;
  name: string;
  size: number;
  type: string;
};

type UpdateListingPayload = {
  listingId: string;
  formData: ListingFormData;
  images: UpdateImagePayload[];
  removedImagePaths: string[];
  video: {
    action: "keep" | "remove" | "external" | "storage";
    video_url?: string | null;
    video_file_name?: string | null;
  };
  deleteVideoPath?: string | null;
};

function mapDbError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("horse_listings") && normalized.includes("does not exist")) {
    return "Database table not found. Run the Supabase SQL migration first.";
  }

  if (
    normalized.includes("could not find") &&
    normalized.includes("horse_listings")
  ) {
    if (normalized.includes("'slug'")) {
      return "Database schema is missing the slug column. Run supabase/migrations/034_horse_listings_schema_columns_sync.sql in Supabase.";
    }
    if (normalized.includes("'published_at'")) {
      return "Database schema is missing the published_at column. Run supabase/migrations/034_horse_listings_schema_columns_sync.sql in Supabase.";
    }
    if (normalized.includes("'view_count'")) {
      return "Database schema is missing the view_count column. Run supabase/migrations/034_horse_listings_schema_columns_sync.sql in Supabase.";
    }
    return "Database schema is out of date. Run supabase/migrations/034_horse_listings_schema_columns_sync.sql in Supabase.";
  }

  if (
    normalized.includes("permission denied for table") ||
    normalized.includes("permission denied")
  ) {
    return "Database permissions not configured. Run supabase/migrations/002_horse_listings_grants.sql in Supabase.";
  }

  if (normalized.includes("row-level security")) {
    return "You do not have permission to create this listing.";
  }

  return "Unable to save your listing right now. Please try again.";
}

function revalidateListingPaths(listingOrId?: Pick<HorseListingRow, "id" | "slug"> | string) {
  const listing =
    typeof listingOrId === "string" ? { id: listingOrId, slug: undefined } : listingOrId;

  revalidatePath("/");
  revalidatePath("/horses");
  revalidatePath("/marketplace");
  revalidatePath(MARKETPLACE_PATHS.sellerDashboard);
  revalidatePath("/account");

  if (listing?.id) {
    revalidatePath(`/horse/${listing.id}`);
    revalidatePath(`/horse/${listing.id}/edit`);
    revalidatePath(`/dashboard/seller/listings/${listing.id}/edit`);
    revalidatePath(`/dashboard/seller/listings/${listing.id}/preview`);
  }

  if (listing?.slug) {
    revalidatePath(getPublicListingPath(listing.slug));
  }
}

async function assignListingSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingId: string,
  name: string
) {
  const slug = buildListingSlug(name, listingId);
  const { error } = await supabase
    .from("horse_listings")
    .update({ slug })
    .eq("id", listingId);

  if (error) {
    throw new Error(error.message);
  }

  return slug;
}

async function fetchOwnerListing(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("id", listingId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as HorseListingRow;
}

function listingHasRequiredMedia(listing: HorseListingRow): boolean {
  return listing.image_urls.length > 0 || Boolean(listing.cover_image_url);
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

function validateSerializedListingImages(
  images: SerializedUploadedListingImage[],
  userId: string,
  listingId: string
): string | null {
  if (images.length === 0) {
    return "Add at least one horse photo before submitting.";
  }

  if (images.length > MAX_LISTING_IMAGES) {
    return `You can upload up to ${MAX_LISTING_IMAGES} images.`;
  }

  if (!images.some((image) => image.isCover)) {
    return "Select a cover image.";
  }

  for (const image of images) {
    if (image.size > MAX_LISTING_IMAGE_BYTES) {
      return "One or more images exceed the 10 MB upload size limit.";
    }

    if (!isListingImageStoragePathOwnedByUser(image.storagePath, userId, listingId)) {
      return "One or more uploaded images could not be verified.";
    }
  }

  return null;
}

function validateUpdateListingImages(
  images: UpdateImagePayload[],
  userId: string,
  listingId: string
): string | null {
  if (images.length === 0) {
    return "Add at least one horse photo before saving.";
  }

  if (images.length > MAX_LISTING_IMAGES) {
    return `You can upload up to ${MAX_LISTING_IMAGES} images.`;
  }

  if (!images.some((image) => image.isCover)) {
    return "Select a cover image.";
  }

  for (const image of images) {
    if (image.size > MAX_LISTING_IMAGE_BYTES) {
      return "One or more images exceed the 10 MB upload size limit.";
    }

    if (!image.publicUrl?.trim() || !image.storagePath?.trim()) {
      return "One or more images could not be processed.";
    }

    if (!isListingImageStoragePathOwnedByUser(image.storagePath, userId, listingId)) {
      return "One or more uploaded images could not be verified.";
    }
  }

  return null;
}

async function finalizeCreatedListing(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  listingId: string,
  shouldPublish: boolean
): Promise<{
  listingRow: HorseListingRow;
  published: boolean;
  publicUrl?: string;
  error?: string;
}> {
  let listingRow =
    (await fetchOwnerListing(supabase, listingId, userId)) ??
    (null as unknown as HorseListingRow);

  if (!listingRow) {
    return {
      listingRow: null as unknown as HorseListingRow,
      published: false,
      error: "Listing could not be loaded after saving images.",
    };
  }

  await syncListingPedigreeFromRow(supabase, userId, listingRow);
  listingRow = (await fetchOwnerListing(supabase, listingId, userId)) ?? listingRow;

  let published = shouldPublish;

  if (shouldPublish) {
    if (!listingHasRequiredMedia(listingRow)) {
      published = false;
      await supabase
        .from("horse_listings")
        .update({ status: "draft", published_at: null })
        .eq("id", listingId)
        .eq("user_id", userId);
      listingRow = (await fetchOwnerListing(supabase, listingId, userId)) ?? listingRow;
    } else if (!listingRow.pedigree_horse_id) {
      published = false;
      await supabase
        .from("horse_listings")
        .update({ status: "draft", published_at: null })
        .eq("id", listingId)
        .eq("user_id", userId);
      listingRow = (await fetchOwnerListing(supabase, listingId, userId)) ?? listingRow;
    } else {
      await refreshListingPublicSnapshots(supabase, userId, listingRow);
      listingRow = (await fetchOwnerListing(supabase, listingId, userId)) ?? listingRow;
    }
  }

  revalidateListingPaths(listingRow);

  return {
    listingRow,
    published,
    publicUrl: published && listingRow.slug ? getPublicListingPath(listingRow.slug) : undefined,
    error:
      shouldPublish && !published
        ? "Listing saved as draft. Pedigree linkage is required before publishing."
        : undefined,
  };
}

async function rollbackCreatedListing(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingId: string,
  userId: string,
  uploadedPaths: string[]
) {
  await removeAllListingVideosForListing(supabase, userId, listingId);
  await removeListingImagesFromStorage(supabase, uploadedPaths);
  await removeAllListingImagesForListing(supabase, userId, listingId);
  await supabase
    .from("horse_listings")
    .delete()
    .eq("id", listingId)
    .eq("user_id", userId);
}

export async function createHorseListing(payload: CreateListingPayload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to submit a listing." };
  }

  if (!payload?.formData) {
    return { error: "Invalid listing submission payload." };
  }

  if (payload.imageCount === 0) {
    return { error: "Add at least one horse photo before submitting." };
  }

  if (payload.imageCount > MAX_LISTING_IMAGES) {
    return { error: `You can upload up to ${MAX_LISTING_IMAGES} images.` };
  }

  const input = buildCreateListingInput(payload.formData, [], {
    pendingVideoUpload: payload.hasVideoFile,
  });

  const locationFields = normalizeListingLocationFields(payload.formData);
  const coordinates = await resolveListingCoordinates(null, locationFields);

  const shouldPublish = payload.publish === true;

  if (shouldPublish) {
    const quota = await assertCanActivateListing(supabase, user.id);
    if (!quota.ok) {
      return {
        error: quota.error,
        errorCode: LISTING_QUOTA_ERROR_CODE,
        quota: quota.quota,
      };
    }
  }

  const insertPayload = {
    user_id: user.id,
    ...input,
    city: locationFields.city,
    postal_code: locationFields.postal_code,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    verified: false,
    status: (shouldPublish ? "active" : "draft") as ListingStatus,
    published_at: shouldPublish ? new Date().toISOString() : null,
  };

  const { data: listing, error } = await supabase
    .from("horse_listings")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !listing) {
    console.error("[createHorseListing] Supabase insert failed", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return {
      error: withDevError(mapDbError(error?.message ?? "Insert failed."), {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      }),
    };
  }

  const listingId = listing.id as string;

  try {
    await assignListingSlug(supabase, listingId, input.name);
  } catch (slugError) {
    await rollbackCreatedListing(supabase, listingId, user.id, []);
    console.error("[createHorseListing] slug assignment failed", slugError);
    return {
      error: withDevError(mapDbError(String(slugError)), {
        message: String(slugError),
      }),
    };
  }

  const listingRow =
    (await fetchOwnerListing(supabase, listingId, user.id)) ??
    (listing as HorseListingRow);

  return {
    data: listingRow,
    shouldPublish,
  };
}

export async function attachHorseListingImages(
  listingId: string,
  images: SerializedUploadedListingImage[],
  options?: { publish?: boolean }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to submit a listing." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("horse_listings")
    .select("id, status, published_at")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Listing not found or you do not have permission to edit it." };
  }

  const validationError = validateSerializedListingImages(images, user.id, listingId);
  if (validationError) {
    return { error: validationError };
  }

  const uploaded = serializedImagesToUploaded(images);
  const imageFields = buildListingImageFields(uploaded);

  const { data: updatedListing, error: updateError } = await supabase
    .from("horse_listings")
    .update(imageFields)
    .eq("id", listingId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !updatedListing) {
    console.error("[attachHorseListingImages] image reference update failed", {
      message: updateError?.message,
      code: updateError?.code,
      details: updateError?.details,
      hint: updateError?.hint,
    });
    return {
      error:
        "Your images uploaded, but the listing could not be finalized. Please try again.",
    };
  }

  const shouldPublish =
    options?.publish === true ||
    (existing.status === "active" && existing.published_at != null);

  const finalized = await finalizeCreatedListing(
    supabase,
    user.id,
    listingId,
    shouldPublish
  );

  if (finalized.error && !finalized.listingRow) {
    return { error: finalized.error };
  }

  return {
    data: finalized.listingRow,
    published: finalized.published,
    publicUrl: finalized.publicUrl,
    error: finalized.error,
  };
}

export async function rollbackHorseListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  await rollbackCreatedListing(supabase, listingId, user.id, []);

  revalidatePath("/");
  revalidatePath("/account");

  return { success: true };
}

export async function updateHorseListingVideo(
  listingId: string,
  video: { video_url: string; video_file_name: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to save video." };
  }

  const { data, error } = await supabase
    .from("horse_listings")
    .update({
      video_url: video.video_url,
      video_file_name: video.video_file_name,
    })
    .eq("id", listingId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error("[updateHorseListingVideo] failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return {
      error: withDevError("Unable to save video on your listing.", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }),
    };
  }

  revalidateListingPaths(listingId);

  return { data: data as HorseListingRow };
}

export async function getHorseListingForOwner(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, unauthenticated: true as const };
  }

  const { data, error } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, forbidden: true as const };
  }

  return { data: data as HorseListingRow };
}

export async function updateHorseListing(payload: UpdateListingPayload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to edit a listing." };
  }

  if (!payload?.listingId || !payload.formData) {
    return { error: "Invalid listing update payload." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("horse_listings")
    .select("id, city, postal_code, country, latitude, longitude")
    .eq("id", payload.listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Listing not found or you do not have permission to edit it." };
  }

  const imageValidationError = validateUpdateListingImages(
    payload.images,
    user.id,
    payload.listingId
  );

  if (imageValidationError) {
    return { error: imageValidationError };
  }

  const assembledImages = payload.images.map((item) => ({
    storagePath: item.storagePath,
    publicUrl: item.publicUrl,
    isCover: item.isCover,
    meta: {
      name: item.name,
      isCover: item.isCover,
      size: item.size,
      type: item.type,
      storagePath: item.storagePath,
      publicUrl: item.publicUrl,
    },
  }));

  const imageFields = buildListingImageFields(assembledImages);
  const fieldUpdates = buildListingFieldUpdates(payload.formData);
  const locationFields = normalizeListingLocationFields(payload.formData);
  const coordinates = await resolveListingCoordinates(
    existing as {
      city: string | null;
      postal_code: string | null;
      country: string;
      latitude: number | null;
      longitude: number | null;
    },
    locationFields
  );

  let videoFields: { video_url: string | null; video_file_name: string | null };

  if (payload.video.action === "keep") {
    const { data: currentListing } = await supabase
      .from("horse_listings")
      .select("video_url, video_file_name")
      .eq("id", payload.listingId)
      .eq("user_id", user.id)
      .single();

    videoFields = {
      video_url: currentListing?.video_url ?? null,
      video_file_name: currentListing?.video_file_name ?? null,
    };
  } else if (payload.video.action === "remove") {
    videoFields = { video_url: null, video_file_name: null };
  } else if (payload.video.action === "storage") {
    videoFields = {
      video_url: payload.video.video_url ?? null,
      video_file_name: payload.video.video_file_name ?? null,
    };
  } else {
    videoFields = {
      video_url: payload.video.video_url ?? null,
      video_file_name: null,
    };
  }

  const { data: updatedListing, error: updateError } = await supabase
    .from("horse_listings")
    .update({
      ...fieldUpdates,
      city: locationFields.city,
      postal_code: locationFields.postal_code,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      ...imageFields,
      ...videoFields,
    })
    .eq("id", payload.listingId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !updatedListing) {
    console.error("[updateHorseListing] failed", {
      message: updateError?.message,
      code: updateError?.code,
      details: updateError?.details,
      hint: updateError?.hint,
    });
    return {
      error: withDevError("Unable to update your listing right now.", {
        message: updateError?.message,
        code: updateError?.code,
        details: updateError?.details,
        hint: updateError?.hint,
      }),
    };
  }

  if (payload.removedImagePaths.length > 0) {
    await removeListingImagesFromStorage(supabase, payload.removedImagePaths);
  }

  if (payload.deleteVideoPath) {
    await removeListingVideoFromStorage(supabase, payload.deleteVideoPath);
  }

  let listingRow = updatedListing as HorseListingRow;

  await syncListingPedigreeFromRow(supabase, user.id, listingRow);

  listingRow =
    (await fetchOwnerListing(supabase, payload.listingId, user.id)) ?? listingRow;

  if (listingRow.status === "active") {
    await refreshListingPublicSnapshots(supabase, user.id, listingRow);
    listingRow =
      (await fetchOwnerListing(supabase, payload.listingId, user.id)) ?? listingRow;
  }

  revalidateListingPaths(listingRow);

  return { data: listingRow };
}

export async function getActiveHorseListings(limit?: number) {
  const supabase = await createClient();

  let query = supabase
    .from("horse_listings")
    .select("*")
    .eq("status", "active")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (limit != null && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [] as HorseListingRow[], error: error.message };
  }

  return { data: (data ?? []) as HorseListingRow[] };
}

export async function getMyHorseListings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [] as HorseListingRow[], error: "Not authenticated." };
  }

  const { data, error } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [] as HorseListingRow[], error: error.message };
  }

  return { data: (data ?? []) as HorseListingRow[] };
}

export async function getHorseListingById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data as HorseListingRow | null) ?? null };
}

export async function deleteHorseListing(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorKey: "notAuthenticated" };
  }

  await removeAllListingVideosForListing(supabase, user.id, id);
  await removeAllListingImagesForListing(supabase, user.id, id);

  const { error } = await supabase
    .from("horse_listings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { errorKey: "deleteFailed" };
  }

  revalidateListingPaths(id);

  return { success: true };
}

export async function getHorseListingForPublicView(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: activeListing, error: activeError } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (activeError) {
    return { data: null, error: activeError.message };
  }

  if (activeListing) {
    return {
      data: activeListing as HorseListingRow,
      isOwnerPreview: false,
    };
  }

  if (!user) {
    return { data: null };
  }

  const { data: ownerListing, error: ownerError } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownerError) {
    return { data: null, error: ownerError.message };
  }

  if (!ownerListing) {
    return { data: null };
  }

  return {
    data: ownerListing as HorseListingRow,
    isOwnerPreview: ownerListing.status !== "active",
  };
}

export async function publishHorseListing(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorKey: "notAuthenticated" };
  }

  const { data: listing, error: fetchError } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !listing) {
    return { errorKey: "publishNotFound" };
  }

  const row = listing as HorseListingRow;

  if (!listingHasRequiredMedia(row)) {
    return { errorKey: "publishNoPhotos" };
  }

  if (!row.pedigree_horse_id) {
    return { errorKey: "publishNoHorseRecord" };
  }

  if (row.status !== "active") {
    const quota = await assertCanActivateListing(supabase, user.id, { excludeListingId: id });
    if (!quota.ok) {
      return {
        errorKey: "publishQuotaExceeded",
        errorCode: LISTING_QUOTA_ERROR_CODE,
        quota: quota.quota,
      };
    }
  }

  const { data, error } = await supabase
    .from("horse_listings")
    .update({
      status: "active",
      published_at: row.published_at ?? new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { errorKey: "publishFailed" };
  }

  const publishedListing = data as HorseListingRow;
  await refreshListingPublicSnapshots(supabase, user.id, publishedListing);

  revalidateListingPaths(publishedListing);

  return { data: publishedListing, publicUrl: getPublicListingPath(publishedListing.slug) };
}

export async function archiveHorseListing(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorKey: "notAuthenticated" };
  }

  const { data, error } = await supabase
    .from("horse_listings")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { errorKey: "archiveFailed" };
  }

  revalidateListingPaths(data as HorseListingRow);

  return { data: data as HorseListingRow };
}

export async function restoreHorseListing(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorKey: "notAuthenticated" };
  }

  const { data, error } = await supabase
    .from("horse_listings")
    .update({ status: "draft" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "archived")
    .select("*")
    .single();

  if (error || !data) {
    return { errorKey: "restoreNotFound" };
  }

  revalidateListingPaths(data as HorseListingRow);

  return { data: data as HorseListingRow };
}

export async function duplicateHorseListing(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorKey: "notAuthenticated" };
  }

  const { data: source, error: fetchError } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !source) {
    return { errorKey: "duplicateNotFound" };
  }

  const row = source as HorseListingRow;

  const { data: created, error: insertError } = await supabase
    .from("horse_listings")
    .insert({
      user_id: user.id,
      name: row.name,
      breed: row.breed,
      gender: row.gender,
      age: row.age,
      height: row.height,
      color: row.color,
      country: row.country,
      discipline: row.discipline,
      level: row.level,
      price: row.price,
      price_on_request: row.price_on_request,
      sire: row.sire,
      dam: row.dam,
      dam_sire: row.dam_sire,
      description: row.description,
      image_urls: [],
      cover_image_url: null,
      images_meta: [],
      video_url: null,
      video_file_name: null,
      seller_name: row.seller_name,
      seller_email: row.seller_email,
      seller_phone: row.seller_phone,
      stable_name: row.stable_name,
      verified: false,
      status: "draft",
      pedigree_horse_id: row.pedigree_horse_id,
      published_at: null,
      public_training_summary: null,
      public_health_summary: null,
    })
    .select("*")
    .single();

  if (insertError || !created) {
    return { errorKey: "duplicateFailed" };
  }

  const newListingId = created.id as string;

  try {
    await assignListingSlug(supabase, newListingId, row.name);
  } catch {
    await supabase.from("horse_listings").delete().eq("id", newListingId).eq("user_id", user.id);
    return { errorKey: "duplicateFailed" };
  }

  const imageCopy = await copyListingImagesForDuplicate(
    supabase,
    user.id,
    row,
    newListingId
  );

  if (imageCopy.error || !imageCopy.data?.length) {
    await removeAllListingImagesForListing(supabase, user.id, newListingId);
    await supabase.from("horse_listings").delete().eq("id", newListingId).eq("user_id", user.id);
    return {
      errorKey: "duplicatePhotosFailed",
    };
  }

  const videoCopy = await copyListingVideoForDuplicate(
    supabase,
    user.id,
    row,
    newListingId
  );

  const { data: duplicated, error: updateError } = await supabase
    .from("horse_listings")
    .update({
      ...buildListingImageFields(imageCopy.data),
      video_url: videoCopy.video_url,
      video_file_name: videoCopy.video_file_name,
    })
    .eq("id", newListingId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !duplicated) {
    await removeAllListingImagesForListing(supabase, user.id, newListingId);
    await removeAllListingVideosForListing(supabase, user.id, newListingId);
    await supabase.from("horse_listings").delete().eq("id", newListingId).eq("user_id", user.id);
    return { errorKey: "duplicateFinalizeFailed" };
  }

  revalidateListingPaths(duplicated as HorseListingRow);

  return {
    data: duplicated as HorseListingRow,
    editUrl: getListingEditPath(newListingId),
  };
}

export async function getHorseListingBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data as HorseListingRow | null) ?? null };
}

export async function incrementListingViewCount(slug: string) {
  if (!isValidListingSlug(slug)) {
    return { error: "Invalid listing slug." };
  }

  const clientIp = await getClientIp();
  const rateLimit = checkRateLimit(`view:${clientIp}:${slug}`, 3, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_horse_listing_view_count", {
    p_slug: slug.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function unpublishHorseListing(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorKey: "notAuthenticated" };
  }

  const { data, error } = await supabase
    .from("horse_listings")
    .update({ status: "draft" })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { errorKey: "unpublishFailed" };
  }

  revalidateListingPaths(id);

  return { data: data as HorseListingRow };
}

export async function markHorseListingSold(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorKey: "notAuthenticated" };
  }

  const { data, error } = await supabase
    .from("horse_listings")
    .update({ status: "sold" })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { errorKey: "markSoldFailed" };
  }

  revalidateListingPaths(id);

  return { data: data as HorseListingRow };
}

export async function getSellerListingStats(): Promise<{
  stats: SellerListingStats;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      stats: { total: 0, active: 0, draft: 0, sold: 0, archived: 0 },
      error: "Not authenticated.",
    };
  }

  const { data, error } = await supabase
    .from("horse_listings")
    .select("status")
    .eq("user_id", user.id);

  if (error) {
    return {
      stats: { total: 0, active: 0, draft: 0, sold: 0, archived: 0 },
      error: error.message,
    };
  }

  const stats: SellerListingStats = {
    total: data?.length ?? 0,
    active: 0,
    draft: 0,
    sold: 0,
    archived: 0,
  };

  for (const row of data ?? []) {
    const status = row.status as ListingStatus;
    if (status === "active") stats.active += 1;
    else if (status === "draft") stats.draft += 1;
    else if (status === "sold") stats.sold += 1;
    else if (status === "archived") stats.archived += 1;
  }

  return { stats };
}
