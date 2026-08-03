import { cache } from "react";
import { createClient } from "@/app/lib/supabase/server";
import { buildPublicListingProfileBySlug } from "@/app/lib/marketplace/listing-display";

export const getCachedPublicListingProfileBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  return buildPublicListingProfileBySlug(supabase, slug);
});
