"use server";

import { revalidatePath } from "next/cache";
import {
  breederRowToCard,
  getBreederCoverUrl,
  getBreederLogoUrl,
  normalizeDisciplines,
  rowToBreeder,
} from "@/app/lib/breeders";
import { rowToStallion, stallionRowToCard } from "@/app/lib/stallions";
import {
  removeAllBreederImagesForProfile,
  removeBreederImagesFromStorage,
  resolveOwnedStoragePath,
  uploadBreederImageToStorage,
  validateBreederImageFile,
} from "@/app/lib/breeder-image-storage";
import { createClient } from "@/app/lib/supabase/server";
import {
  BreederFormData,
  BreederMediaPayload,
  SaveBreederProfilePayload,
} from "@/app/types/breeder";

function mapBreederDbError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("breeders") && normalized.includes("does not exist")) {
    return "Database table not found. Run supabase/migrations/009_breeders_stallions.sql in Supabase.";
  }

  if (
    normalized.includes("permission denied for table breeders") ||
    normalized.includes("permission denied for table stallions") ||
    normalized.includes("permission denied for table")
  ) {
    return "Database permissions not configured. Run supabase/migrations/011_breeders_stallions_grants.sql in Supabase.";
  }

  if (normalized.includes("breeders_owner_id_active_idx")) {
    return "You already have an active stud farm profile. Refresh the page or edit your existing profile.";
  }

  if (normalized.includes("row-level security")) {
    return "You do not have permission to manage this stud farm profile.";
  }

  return "Unable to save your stud farm profile right now. Please try again.";
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

function logBreederDbError(context: string, error: {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
} | null) {
  console.error(`[${context}] Supabase breeders operation failed`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  });
}

function buildBreederPayload(form: BreederFormData) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    country: form.country.trim(),
    city: form.city.trim() || null,
    website: form.website.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    disciplines: normalizeDisciplines(form.disciplines),
  };
}

function parseSaveBreederProfilePayload(formData: FormData): SaveBreederProfilePayload | null {
  const payloadRaw = formData.get("payload");

  if (typeof payloadRaw !== "string") {
    return null;
  }

  try {
    return JSON.parse(payloadRaw) as SaveBreederProfilePayload;
  } catch {
    return null;
  }
}

function parseBreederImageFile(formData: FormData, field: "logo_file" | "cover_file"): File | null {
  const value = formData.get(field);
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }
  return value;
}

type MediaResolveResult = {
  url: string | null;
  error?: string;
  deleteAfterSuccess: string[];
};

async function processBreederMediaField(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  breederId: string,
  kind: "logo" | "cover",
  media: BreederMediaPayload,
  file: File | null,
  newlyUploadedPaths: string[]
): Promise<MediaResolveResult> {
  if (file) {
    const uploadResult = await uploadBreederImageToStorage(
      supabase,
      userId,
      breederId,
      kind,
      file
    );

    if (uploadResult.error || !uploadResult.data) {
      return {
        url: null,
        error: uploadResult.error ?? "Image upload failed.",
        deleteAfterSuccess: [],
      };
    }

    newlyUploadedPaths.push(uploadResult.data.storagePath);

    const oldPath =
      media.existingStoragePath?.trim() ||
      (media.existingUrl ? resolveOwnedStoragePath(media.existingUrl, userId) : null);

    return {
      url: uploadResult.data.publicUrl,
      deleteAfterSuccess: oldPath ? [oldPath] : [],
    };
  }

  if (media.action === "remove") {
    const oldPath =
      media.existingStoragePath?.trim() ||
      (media.existingUrl ? resolveOwnedStoragePath(media.existingUrl, userId) : null);

    return {
      url: null,
      deleteAfterSuccess: oldPath ? [oldPath] : [],
    };
  }

  return {
    url: media.existingUrl?.trim() || null,
    deleteAfterSuccess: [],
  };
}

async function rollbackCreatedBreeder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  breederId: string,
  uploadedPaths: string[]
) {
  await removeBreederImagesFromStorage(supabase, uploadedPaths, userId);
  await removeAllBreederImagesForProfile(supabase, userId, breederId);
  await supabase.from("breeders").delete().eq("id", breederId).eq("owner_id", userId);
}

export async function getActiveBreeders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("breeders")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error || !data) {
    return { breeders: [], error: error?.message };
  }

  const breederRows = data.map((row) => rowToBreeder(row as Record<string, unknown>));
  const breederIds = breederRows.map((row) => row.id);

  const stallionCounts = new Map<string, number>();
  if (breederIds.length > 0) {
    const { data: stallionRows } = await supabase
      .from("stallions")
      .select("breeder_id")
      .eq("status", "active")
      .in("breeder_id", breederIds);

    for (const row of stallionRows ?? []) {
      const id = row.breeder_id as string;
      stallionCounts.set(id, (stallionCounts.get(id) ?? 0) + 1);
    }
  }

  return {
    breeders: breederRows.map((row) =>
      breederRowToCard(row, stallionCounts.get(row.id) ?? 0)
    ),
  };
}

export async function getBreederById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("breeders")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    return { breeder: null, error: error?.message };
  }

  const breeder = rowToBreeder(data as Record<string, unknown>);

  const [{ data: stallionData }, { data: listingData }] = await Promise.all([
    supabase
      .from("stallions")
      .select("*")
      .eq("breeder_id", id)
      .eq("status", "active")
      .order("name", { ascending: true }),
    supabase
      .from("horse_listings")
      .select("*")
      .eq("user_id", breeder.owner_id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  const stallions = (stallionData ?? []).map((row) =>
    stallionRowToCard(
      rowToStallion(row as Record<string, unknown>),
      breeder
    )
  );

  return {
    breeder: {
      ...breederRowToCard(breeder, stallions.length),
      logoUrl: getBreederLogoUrl(breeder),
      coverImageUrl: getBreederCoverUrl(breeder),
      website: breeder.website,
      email: breeder.email,
      phone: breeder.phone,
    },
    stallions,
    listings: listingData ?? [],
  };
}

export async function getMyBreederProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { breeder: null, unauthenticated: true as const };
  }

  const { data, error } = await supabase
    .from("breeders")
    .select("*")
    .eq("owner_id", user.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    logBreederDbError("getMyBreederProfile", error);
    return { breeder: null, error: error?.message };
  }

  return { breeder: rowToBreeder(data as Record<string, unknown>) };
}

export async function saveBreederProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to manage a stud farm profile." };
  }

  const payload = parseSaveBreederProfilePayload(formData);

  if (!payload) {
    return { error: "Invalid stud farm profile submission." };
  }

  if (!payload.form.name.trim() || !payload.form.country.trim()) {
    return { error: "Stud farm name and country are required." };
  }

  const logoFile = parseBreederImageFile(formData, "logo_file");
  const coverFile = parseBreederImageFile(formData, "cover_file");

  for (const file of [logoFile, coverFile].filter(Boolean) as File[]) {
    const validationError = validateBreederImageFile(file);
    if (validationError) {
      return { error: validationError };
    }
  }

  if (logoFile && payload.logo.action !== "upload") {
    return { error: "Invalid logo upload payload." };
  }

  if (coverFile && payload.cover.action !== "upload") {
    return { error: "Invalid cover upload payload." };
  }

  const baseFields = buildBreederPayload(payload.form);
  const existing = await getMyBreederProfile();
  const newlyUploadedPaths: string[] = [];

  if (existing.breeder) {
    const breederId = existing.breeder.id;
    const pathsToDeleteAfterSuccess: string[] = [];

    const logoResult = await processBreederMediaField(
      supabase,
      user.id,
      breederId,
      "logo",
      payload.logo,
      logoFile,
      newlyUploadedPaths
    );

    if (logoResult.error) {
      await removeBreederImagesFromStorage(supabase, newlyUploadedPaths, user.id);
      return { error: logoResult.error };
    }

    pathsToDeleteAfterSuccess.push(...logoResult.deleteAfterSuccess);

    const coverResult = await processBreederMediaField(
      supabase,
      user.id,
      breederId,
      "cover",
      payload.cover,
      coverFile,
      newlyUploadedPaths
    );

    if (coverResult.error) {
      await removeBreederImagesFromStorage(supabase, newlyUploadedPaths, user.id);
      return { error: coverResult.error };
    }

    pathsToDeleteAfterSuccess.push(...coverResult.deleteAfterSuccess);

    const { data, error } = await supabase
      .from("breeders")
      .update({
        ...baseFields,
        logo_url: logoResult.url,
        cover_image_url: coverResult.url,
      })
      .eq("id", breederId)
      .eq("owner_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      await removeBreederImagesFromStorage(supabase, newlyUploadedPaths, user.id);
      logBreederDbError("saveBreederProfile:update", error);
      return {
        error: withDevError(mapBreederDbError(error?.message ?? "Update failed."), {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        }),
      };
    }

    await removeBreederImagesFromStorage(supabase, pathsToDeleteAfterSuccess, user.id);
    revalidatePaths(breederId);
    return { data: rowToBreeder(data as Record<string, unknown>) };
  }

  const { data, error } = await supabase
    .from("breeders")
    .insert({
      owner_id: user.id,
      ...baseFields,
      logo_url: null,
      cover_image_url: null,
      verified: false,
      status: "active" as const,
    })
    .select("*")
    .single();

  if (error || !data) {
    logBreederDbError("saveBreederProfile:insert", error);
    return {
      error: withDevError(mapBreederDbError(error?.message ?? "Insert failed."), {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      }),
    };
  }

  const breederId = data.id as string;
  const pathsToDeleteAfterSuccess: string[] = [];

  const logoResult = await processBreederMediaField(
    supabase,
    user.id,
    breederId,
    "logo",
    payload.logo,
    logoFile,
    newlyUploadedPaths
  );

  if (logoResult.error) {
    await rollbackCreatedBreeder(supabase, user.id, breederId, newlyUploadedPaths);
    return { error: logoResult.error };
  }

  pathsToDeleteAfterSuccess.push(...logoResult.deleteAfterSuccess);

  const coverResult = await processBreederMediaField(
    supabase,
    user.id,
    breederId,
    "cover",
    payload.cover,
    coverFile,
    newlyUploadedPaths
  );

  if (coverResult.error) {
    await rollbackCreatedBreeder(supabase, user.id, breederId, newlyUploadedPaths);
    return { error: coverResult.error };
  }

  pathsToDeleteAfterSuccess.push(...coverResult.deleteAfterSuccess);

  if (logoResult.url !== null || coverResult.url !== null) {
    const { data: updated, error: updateError } = await supabase
      .from("breeders")
      .update({
        logo_url: logoResult.url,
        cover_image_url: coverResult.url,
      })
      .eq("id", breederId)
      .eq("owner_id", user.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      await rollbackCreatedBreeder(supabase, user.id, breederId, newlyUploadedPaths);
      logBreederDbError("saveBreederProfile:image-update", updateError);
      return {
        error: withDevError(
          "Your stud farm profile was created, but the uploaded images could not be saved. Please try again.",
          {
            message: updateError?.message,
            code: updateError?.code,
            details: updateError?.details,
            hint: updateError?.hint,
          }
        ),
      };
    }

    await removeBreederImagesFromStorage(supabase, pathsToDeleteAfterSuccess, user.id);
    revalidatePaths(breederId);
    return { data: rowToBreeder(updated as Record<string, unknown>) };
  }

  revalidatePaths(breederId);
  return { data: rowToBreeder(data as Record<string, unknown>) };
}

export async function deleteBreederProfile(breederId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  await removeAllBreederImagesForProfile(supabase, user.id, breederId);

  const { error } = await supabase
    .from("breeders")
    .delete()
    .eq("id", breederId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: "Unable to delete stud farm profile." };
  }

  revalidatePath("/account");
  revalidatePath("/breeders");
  return { data: true };
}

function revalidatePaths(breederId: string) {
  revalidatePath("/account");
  revalidatePath("/breeders");
  revalidatePath(`/breeders/${breederId}`);
}
