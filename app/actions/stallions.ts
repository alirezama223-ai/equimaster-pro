"use server";

import { revalidatePath } from "next/cache";
import { isValidBreedName } from "@/app/lib/breeds";
import { DEFAULT_DISCIPLINE } from "@/app/lib/constants/disciplines";
import { getMyBreederProfile } from "@/app/actions/breeders";
import { rowToBreeder } from "@/app/lib/breeders";
import {
  buildStallionImageFields,
  collectOwnedStallionImagePathsFromRow,
  filterOwnedRemovedPaths,
  removeAllStallionImagesForStallion,
  removeStallionImagesFromStorage,
  uploadStallionImagesToStorage,
  validateStallionImageFile,
} from "@/app/lib/stallion-image-storage";
import {
  mapBreederJoin,
  rowToStallion,
  stallionRowToCard,
  stallionRowToDetail,
} from "@/app/lib/stallions";
import { syncStallionPedigreeFromRow } from "@/app/lib/pedigree-sync";
import { createClient } from "@/app/lib/supabase/server";
import { BreederRow } from "@/app/types/breeder";
import {
  CreateStallionPayload,
  StallionFormData,
  UpdateStallionPayload,
} from "@/app/types/stallion";

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

function mapStallionDbError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("permission denied for table")) {
    return "Database permissions not configured. Run supabase/migrations/011_breeders_stallions_grants.sql in Supabase.";
  }

  if (normalized.includes("cannot coerce the result to a single json object")) {
    return "Stallion update policy misconfigured. Run supabase/migrations/012_stallions_update_rls.sql in Supabase.";
  }

  return "Unable to save stallion right now. Please try again.";
}

function mapStallionDeleteError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("permission denied for table")) {
    return "Database permissions not configured. Run supabase/migrations/011_breeders_stallions_grants.sql in Supabase.";
  }

  if (normalized.includes("delete affected 0 rows")) {
    return "Stallion delete policy misconfigured. Run supabase/migrations/013_stallions_delete_rls.sql in Supabase.";
  }

  return "Unable to delete stallion right now. Please try again.";
}

function buildStallionFields(form: StallionFormData, breederId: string) {
  return {
    breeder_id: breederId,
    name: form.name.trim(),
    breed: form.breed.trim(),
    studbook: form.studbook.trim() || null,
    birth_year: form.birthYear ? Number(form.birthYear) : null,
    color: form.color.trim() || "—",
    height: form.height ? Number(form.height) : null,
    country: form.country.trim(),
    discipline: form.discipline.trim() || DEFAULT_DISCIPLINE,
    competition_level: form.competitionLevel.trim() || "—",
    sire: form.sire.trim() || "—",
    dam: form.dam.trim() || "—",
    dam_sire: form.damSire.trim() || "—",
    stud_fee: form.studFee.trim() ? Number(form.studFee) : null,
    stud_fee_currency: form.studFeeCurrency.trim() || "EUR",
    availability: form.availability,
    breeding_methods: form.breedingMethods,
    description: form.description.trim(),
    performance: form.performance.trim(),
    breeding_highlights: form.breedingHighlights.trim(),
  };
}

function parseStallionPayload(
  formData: FormData
): CreateStallionPayload | UpdateStallionPayload | null {
  const payloadRaw = formData.get("payload");
  if (typeof payloadRaw !== "string") return null;

  try {
    const parsed = JSON.parse(payloadRaw) as CreateStallionPayload | UpdateStallionPayload;
    if ("stallionId" in parsed && parsed.stallionId) {
      return parsed as UpdateStallionPayload;
    }
    return parsed as CreateStallionPayload;
  } catch {
    return null;
  }
}

function parseStallionImageFiles(formData: FormData, prefix: "image" | "image_new", count: number): File[] {
  const files: File[] = [];

  for (let index = 0; index < count; index += 1) {
    const value = formData.get(`${prefix}_${index}`);
    if (!(value instanceof File) || value.size === 0) continue;
    files.push(value);
  }

  return files;
}

async function cleanupStallionUploadArtifacts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  stallionId: string,
  uploadedPaths: string[]
) {
  await removeStallionImagesFromStorage(supabase, uploadedPaths, userId);
  await removeAllStallionImagesForStallion(supabase, userId, stallionId);
}

async function assembleStallionImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  stallionId: string,
  imagePayload: UpdateStallionPayload["images"],
  newFiles: File[]
) {
  const newlyUploadedPaths: string[] = [];
  const assembled: Array<{ storagePath: string; publicUrl: string; isCover: boolean }> = [];

  for (const item of imagePayload) {
    if (!item.isNew) {
      if (!item.existingUrl) continue;
      assembled.push({
        storagePath: item.storagePath ?? "",
        publicUrl: item.existingUrl,
        isCover: item.isCover,
      });
      continue;
    }

    const file = newFiles[item.newFileIndex ?? -1];
    if (!file) {
      await removeStallionImagesFromStorage(supabase, newlyUploadedPaths, userId);
      return { error: "One or more new images could not be processed." as const };
    }

    const uploadResult = await uploadStallionImagesToStorage(supabase, userId, stallionId, [
      {
        file,
        isCover: item.isCover,
        name: item.name,
        type: item.type,
        size: item.size,
      },
    ]);

    if (uploadResult.error || !uploadResult.data?.[0]) {
      await removeStallionImagesFromStorage(supabase, newlyUploadedPaths, userId);
      return {
        error:
          uploadResult.error ?? "Your stallion was not saved because image upload failed.",
      };
    }

    newlyUploadedPaths.push(uploadResult.data[0].storagePath);
    assembled.push(uploadResult.data[0]);
  }

  return { assembled, newlyUploadedPaths };
}

export async function getActiveStallions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stallions")
    .select(
      `
      *,
      breeders (
        id,
        name,
        country,
        city,
        verified,
        status
      )
    `
    )
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("stallions")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (fallbackError || !fallback) {
      return { stallions: [], error: fallbackError?.message ?? error.message };
    }

    const breederIds = [...new Set(fallback.map((row) => row.breeder_id as string))];
    const { data: breeders } = await supabase
      .from("breeders")
      .select("*")
      .in("id", breederIds)
      .eq("status", "active");

    const breederMap = new Map(
      (breeders ?? []).map((row) => [row.id as string, rowToBreeder(row as Record<string, unknown>)])
    );

    return {
      stallions: fallback
        .map((row) => {
          const stallion = rowToStallion(row as Record<string, unknown>);
          const breeder = breederMap.get(stallion.breeder_id);
          if (!breeder) return null;
          return stallionRowToCard(stallion, breeder);
        })
        .filter(Boolean),
    };
  }

  const stallions = (data ?? [])
    .map((row) => {
      const stallion = rowToStallion(row as Record<string, unknown>);
      const breeder = mapBreederJoin(row as { breeders?: BreederRow | BreederRow[] | null });
      if (!breeder || breeder.status !== "active") return null;
      return stallionRowToCard(stallion, breeder);
    })
    .filter(Boolean);

  return { stallions };
}

export async function getStallionById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stallions")
    .select(
      `
      *,
      breeders (*)
    `
    )
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    const { data: fallback } = await supabase
      .from("stallions")
      .select("*")
      .eq("id", id)
      .eq("status", "active")
      .maybeSingle();

    if (!fallback) {
      return { stallion: null };
    }

    const stallion = rowToStallion(fallback as Record<string, unknown>);
    const { data: breederData } = await supabase
      .from("breeders")
      .select("*")
      .eq("id", stallion.breeder_id)
      .eq("status", "active")
      .maybeSingle();

    if (!breederData) {
      return { stallion: null };
    }

    return {
      stallion: stallionRowToDetail(
        stallion,
        rowToBreeder(breederData as Record<string, unknown>)
      ),
      pedigreeHorseId: stallion.pedigree_horse_id,
    };
  }

  const stallion = rowToStallion(data as Record<string, unknown>);
  const breeder = mapBreederJoin(data as { breeders?: BreederRow | BreederRow[] | null });
  if (!breeder) {
    return { stallion: null };
  }

  return { stallion: stallionRowToDetail(stallion, breeder), pedigreeHorseId: stallion.pedigree_horse_id };
}

export async function getMyStallions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { stallions: [], unauthenticated: true as const };
  }

  const { data, error } = await supabase
    .from("stallions")
    .select("*")
    .eq("owner_id", user.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { stallions: [] };
  }

  const breederProfile = await getMyBreederProfile();

  return {
    stallions: data.map((row) => rowToStallion(row as Record<string, unknown>)),
    breederName: breederProfile.breeder?.name ?? "My Stud Farm",
  };
}

export async function saveStallion(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to manage stallions." };
  }

  const breederProfile = await getMyBreederProfile();
  if (!breederProfile.breeder) {
    return { error: "Create your stud farm profile before adding stallions." };
  }

  const payload = parseStallionPayload(formData);

  if (!payload) {
    return { error: "Invalid stallion submission payload." };
  }

  const isUpdate = "stallionId" in payload;
  const form = payload.form;

  if (!form.name.trim() || !form.breed.trim() || !form.country.trim()) {
    return { error: "Stallion name, breed, and country are required." };
  }

  if (!isValidBreedName(form.breed)) {
    return { error: "Select a breed from the list." };
  }

  const baseFields = buildStallionFields(form, breederProfile.breeder.id);

  if (isUpdate) {
    const updatePayload = payload as UpdateStallionPayload;
    const { data: existing } = await supabase
      .from("stallions")
      .select("id")
      .eq("id", updatePayload.stallionId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!existing) {
      return { error: "Stallion not found or you do not have permission to edit it." };
    }

    if (updatePayload.images.length === 0) {
      return { error: "Add at least one stallion photo before saving." };
    }

    const expectedNewCount = updatePayload.images.filter((image) => image.isNew).length;
    const newFiles = parseStallionImageFiles(formData, "image_new", expectedNewCount);

    if (newFiles.length !== expectedNewCount) {
      return { error: "One or more new images could not be uploaded. Please try again." };
    }

    for (const file of newFiles) {
      const validationError = validateStallionImageFile(file);
      if (validationError) {
        return { error: validationError };
      }
    }

    const assembly = await assembleStallionImages(
      supabase,
      user.id,
      updatePayload.stallionId,
      updatePayload.images,
      newFiles
    );

    if ("error" in assembly && assembly.error) {
      return { error: assembly.error };
    }

    const { assembled, newlyUploadedPaths } = assembly as {
      assembled: Array<{ storagePath: string; publicUrl: string; isCover: boolean }>;
      newlyUploadedPaths: string[];
    };

    const imageFields = buildStallionImageFields(assembled);
    const removedPaths = filterOwnedRemovedPaths(updatePayload.removedImagePaths, user.id);

    const { data, error } = await supabase
      .from("stallions")
      .update({
        ...baseFields,
        ...imageFields,
      })
      .eq("id", updatePayload.stallionId)
      .eq("owner_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      await removeStallionImagesFromStorage(supabase, newlyUploadedPaths, user.id);
      console.error("[saveStallion:update] Supabase error", error);
      return {
        error: withDevError(mapStallionDbError(error?.message ?? "Update failed."), {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        }),
      };
    }

    if (removedPaths.length > 0) {
      await removeStallionImagesFromStorage(supabase, removedPaths, user.id);
    }

    revalidateStallionPaths(updatePayload.stallionId, breederProfile.breeder.id);
    const stallionRow = rowToStallion(data as Record<string, unknown>);
    await syncStallionPedigreeFromRow(supabase, user.id, stallionRow);
    return { data: stallionRow };
  }

  const createPayload = payload as CreateStallionPayload;

  if (createPayload.images.length === 0) {
    return { error: "Add at least one stallion photo before saving." };
  }

  const imageFiles = parseStallionImageFiles(formData, "image", createPayload.images.length);

  if (imageFiles.length !== createPayload.images.length) {
    return { error: "One or more selected images could not be uploaded. Please try again." };
  }

  for (const file of imageFiles) {
    const validationError = validateStallionImageFile(file);
    if (validationError) {
      return { error: validationError };
    }
  }

  const stallionId = crypto.randomUUID();

  const uploadInputs = createPayload.images.map((image, index) => ({
    file: imageFiles[index],
    isCover: image.isCover,
    name: image.name,
    type: image.type,
    size: image.size,
  }));

  const uploadResult = await uploadStallionImagesToStorage(
    supabase,
    user.id,
    stallionId,
    uploadInputs
  );

  if (uploadResult.error || !uploadResult.data?.length) {
    return {
      error:
        uploadResult.error ?? "Your stallion was not saved because image upload failed.",
    };
  }

  const uploadedPaths = uploadResult.data.map((image) => image.storagePath);
  const imageFields = buildStallionImageFields(uploadResult.data);

  const { data, error } = await supabase
    .from("stallions")
    .insert({
      id: stallionId,
      owner_id: user.id,
      ...baseFields,
      ...imageFields,
      verified: false,
      status: "active",
    })
    .select("*")
    .single();

  if (error || !data) {
    await cleanupStallionUploadArtifacts(supabase, user.id, stallionId, uploadedPaths);
    console.error("[saveStallion:insert] Supabase error", error);
    return {
      error: withDevError(mapStallionDbError(error?.message ?? "Insert failed."), {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      }),
    };
  }

  revalidateStallionPaths(stallionId, breederProfile.breeder.id);
  const stallionRow = rowToStallion(data as Record<string, unknown>);
  await syncStallionPedigreeFromRow(supabase, user.id, stallionRow);
  return { data: stallionRow };
}

export async function deleteStallion(stallionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("stallions")
    .select("id, breeder_id, image_urls, cover_image_url")
    .eq("id", stallionId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("[deleteStallion] ownership fetch failed", fetchError);
    return {
      error: withDevError(mapStallionDeleteError(fetchError.message), {
        message: fetchError.message,
        code: fetchError.code,
        details: fetchError.details,
        hint: fetchError.hint,
      }),
    };
  }

  if (!existing) {
    return { error: "Stallion not found or you do not have permission to delete it." };
  }

  const ownedImagePaths = collectOwnedStallionImagePathsFromRow(existing, user.id);

  const { data: deletedRows, error: deleteError } = await supabase
    .from("stallions")
    .delete()
    .eq("id", stallionId)
    .eq("owner_id", user.id)
    .select("id");

  if (deleteError) {
    console.error("[deleteStallion] Supabase delete failed", deleteError);
    return {
      error: withDevError(mapStallionDeleteError(deleteError.message), {
        message: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint,
      }),
    };
  }

  if (!deletedRows?.length) {
    console.error("[deleteStallion] delete affected 0 rows", {
      stallionId,
      userId: user.id,
    });
    return {
      error: withDevError(mapStallionDeleteError("DELETE affected 0 rows"), {
        message: "DELETE affected 0 rows",
        code: "PGRST116",
        details: "The stallion row was not deleted. Check stallions DELETE RLS policy and grants.",
      }),
    };
  }

  if (ownedImagePaths.length > 0) {
    await removeStallionImagesFromStorage(supabase, ownedImagePaths, user.id);
  }

  await removeAllStallionImagesForStallion(supabase, user.id, stallionId);

  revalidatePath("/account");
  revalidatePath("/stallions");
  revalidatePath(`/stallions/${stallionId}`);
  if (existing.breeder_id) {
    revalidatePath(`/breeders/${existing.breeder_id as string}`);
  }

  return { data: true };
}

function revalidateStallionPaths(stallionId: string, breederId: string) {
  revalidatePath("/account");
  revalidatePath("/stallions");
  revalidatePath(`/stallions/${stallionId}`);
  revalidatePath(`/breeders/${breederId}`);
}

export async function getStallionForOwnerEdit(stallionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { stallion: null, unauthenticated: true as const };
  }

  const { data } = await supabase
    .from("stallions")
    .select("*")
    .eq("id", stallionId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!data) {
    return { stallion: null };
  }

  return { stallion: rowToStallion(data as Record<string, unknown>) };
}
