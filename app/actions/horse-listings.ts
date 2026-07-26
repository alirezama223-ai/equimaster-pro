"use server";

import { revalidatePath } from "next/cache";
import {
  buildListingImageFields,
  removeAllListingImagesForListing,
  removeListingImagesFromStorage,
  uploadListingImagesToStorage,
} from "@/app/lib/horse-image-storage";
import {
  buildCreateListingInput,
  buildListingFieldUpdates,
} from "@/app/lib/horse-listings";
import { syncListingPedigreeFromRow } from "@/app/lib/pedigree-sync";
import {
  removeAllListingVideosForListing,
  removeListingVideoFromStorage,
} from "@/app/lib/horse-video-storage";
import { createClient } from "@/app/lib/supabase/server";
import { HorseListingRow } from "@/app/types/horse-listing";
import { ListingFormData } from "@/app/types/listing";

type ListingImagePayload = {
  isCover: boolean;
  name: string;
  size: number;
  type: string;
};

type CreateListingPayload = {
  formData: ListingFormData;
  images: ListingImagePayload[];
  hasVideoFile: boolean;
};

type UpdateImagePayload = {
  isCover: boolean;
  isNew: boolean;
  existingUrl?: string;
  storagePath?: string;
  newFileIndex?: number;
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

function parseUpdateListingFormData(formData: FormData): UpdateListingPayload | null {
  const payloadRaw = formData.get("payload");

  if (typeof payloadRaw !== "string") {
    return null;
  }

  try {
    return JSON.parse(payloadRaw) as UpdateListingPayload;
  } catch {
    return null;
  }
}

function parseNewListingImageFiles(formData: FormData, imageCount: number): File[] {
  const files: File[] = [];

  for (let index = 0; index < imageCount; index += 1) {
    const value = formData.get(`image_new_${index}`);
    if (!(value instanceof File) || value.size === 0) {
      continue;
    }
    files.push(value);
  }

  return files;
}

function parseCreateListingFormData(formData: FormData): CreateListingPayload | null {
  const payloadRaw = formData.get("payload");

  if (typeof payloadRaw !== "string") {
    return null;
  }

  try {
    return JSON.parse(payloadRaw) as CreateListingPayload;
  } catch {
    return null;
  }
}

function parseListingImageFiles(formData: FormData, imageCount: number): File[] {
  const files: File[] = [];

  for (let index = 0; index < imageCount; index += 1) {
    const value = formData.get(`image_${index}`);
    if (!(value instanceof File) || value.size === 0) {
      continue;
    }
    files.push(value);
  }

  return files;
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

export async function createHorseListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to submit a listing." };
  }

  const payload = parseCreateListingFormData(formData);

  if (!payload) {
    return { error: "Invalid listing submission payload." };
  }

  const imageFiles = parseListingImageFiles(formData, payload.images.length);

  if (imageFiles.length === 0) {
    return { error: "Add at least one horse photo before submitting." };
  }

  if (imageFiles.length !== payload.images.length) {
    return { error: "One or more selected images could not be uploaded. Please try again." };
  }

  const input = buildCreateListingInput(payload.formData, payload.images, {
    pendingVideoUpload: payload.hasVideoFile,
  });

  const insertPayload = {
    user_id: user.id,
    ...input,
    verified: false,
    status: "active" as const,
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

  const uploadInputs = payload.images.map((image, index) => ({
    file: imageFiles[index],
    isCover: image.isCover,
    name: image.name,
    type: image.type,
    size: image.size,
  }));

  const uploadResult = await uploadListingImagesToStorage(
    supabase,
    user.id,
    listingId,
    uploadInputs
  );

  if (uploadResult.error || !uploadResult.data?.length) {
    await rollbackCreatedListing(supabase, listingId, user.id, []);
    return {
      error:
        uploadResult.error ??
        "Your listing was not saved because image upload failed.",
    };
  }

  const imageFields = buildListingImageFields(uploadResult.data);

  const { data: updatedListing, error: updateError } = await supabase
    .from("horse_listings")
    .update(imageFields)
    .eq("id", listingId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !updatedListing) {
    await rollbackCreatedListing(
      supabase,
      listingId,
      user.id,
      uploadResult.data.map((image) => image.storagePath)
    );
    console.error("[createHorseListing] image reference update failed", {
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

  revalidatePath("/");
  revalidatePath("/account");

  await syncListingPedigreeFromRow(supabase, user.id, updatedListing as HorseListingRow);

  return { data: updatedListing as HorseListingRow };
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

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath(`/horse/${listingId}`);

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

export async function updateHorseListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to edit a listing." };
  }

  const payload = parseUpdateListingFormData(formData);

  if (!payload) {
    return { error: "Invalid listing update payload." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("horse_listings")
    .select("id")
    .eq("id", payload.listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Listing not found or you do not have permission to edit it." };
  }

  if (payload.images.length === 0) {
    return { error: "Add at least one horse photo before saving." };
  }

  const expectedNewCount = payload.images.filter((image) => image.isNew).length;
  const newFiles = parseNewListingImageFiles(formData, expectedNewCount);

  if (newFiles.length !== expectedNewCount) {
    return { error: "One or more new images could not be uploaded. Please try again." };
  }

  const newlyUploadedPaths: string[] = [];

  const assembledImages: Array<{
    storagePath: string;
    publicUrl: string;
    isCover: boolean;
    meta: {
      name: string;
      isCover: boolean;
      size: number;
      type: string;
      storagePath?: string;
      publicUrl?: string;
    };
  }> = [];

  for (const item of payload.images) {
    if (!item.isNew) {
      if (!item.existingUrl) continue;

      assembledImages.push({
        storagePath: item.storagePath ?? "",
        publicUrl: item.existingUrl,
        isCover: item.isCover,
        meta: {
          name: item.name,
          isCover: item.isCover,
          size: item.size,
          type: item.type,
          storagePath: item.storagePath,
          publicUrl: item.existingUrl,
        },
      });
      continue;
    }

    const file = newFiles[item.newFileIndex ?? -1];
    if (!file) {
      await removeListingImagesFromStorage(supabase, newlyUploadedPaths);
      return { error: "One or more new images could not be processed." };
    }

    const uploadResult = await uploadListingImagesToStorage(
      supabase,
      user.id,
      payload.listingId,
      [
        {
          file,
          isCover: item.isCover,
          name: item.name,
          type: item.type,
          size: item.size,
        },
      ]
    );

    if (uploadResult.error || !uploadResult.data?.[0]) {
      await removeListingImagesFromStorage(supabase, newlyUploadedPaths);
      return {
        error: uploadResult.error ?? "Your listing was not updated because image upload failed.",
      };
    }

    newlyUploadedPaths.push(uploadResult.data[0].storagePath);
    assembledImages.push(uploadResult.data[0]);
  }

  const imageFields = buildListingImageFields(assembledImages);
  const fieldUpdates = buildListingFieldUpdates(payload.formData);

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
      ...imageFields,
      ...videoFields,
    })
    .eq("id", payload.listingId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !updatedListing) {
    await removeListingImagesFromStorage(supabase, newlyUploadedPaths);
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

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath(`/horse/${payload.listingId}`);
  revalidatePath(`/horse/${payload.listingId}/edit`);

  await syncListingPedigreeFromRow(supabase, user.id, updatedListing as HorseListingRow);

  return { data: updatedListing as HorseListingRow };
}

export async function getActiveHorseListings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

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
    return { error: "You must be signed in to delete a listing." };
  }

  await removeAllListingVideosForListing(supabase, user.id, id);
  await removeAllListingImagesForListing(supabase, user.id, id);

  const { error } = await supabase
    .from("horse_listings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: mapDbError(error.message) };
  }

  revalidatePath("/");
  revalidatePath("/account");

  return { success: true };
}
