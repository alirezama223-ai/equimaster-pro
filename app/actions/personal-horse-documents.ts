"use server";

import { createClient } from "@/app/lib/supabase/server";

export async function uploadPersonalHorseDocument(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const horseId = String(formData.get("horse_id") || "");
  const documentType = String(formData.get("document_type") || "passport");
  const file = formData.get("file");
  if (!horseId || !(file instanceof File) || file.size === 0) return { ok: false, error: "Please choose a document." };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: "Maximum file size is 20 MB." };

  const { data: horse } = await supabase.from("personal_horses").select("id").eq("id", horseId).eq("owner_id", user.id).maybeSingle();
  if (!horse) return { ok: false, error: "Horse not found." };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${horseId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("personal-horse-documents").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { error: insertError } = await supabase.from("personal_horse_documents").insert({
    personal_horse_id: horseId,
    owner_id: user.id,
    document_type: documentType,
    file_path: path,
    original_filename: file.name,
    extraction_status: "pending",
  });
  if (insertError) {
    await supabase.storage.from("personal-horse-documents").remove([path]);
    return { ok: false, error: insertError.message };
  }

  return { ok: true };
}
