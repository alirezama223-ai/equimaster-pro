"use server";

import { backfillListingCoordinatesBatch } from "@/app/lib/geocoding/backfill-listings";
import { requireAdmin } from "@/app/lib/admin";

export async function backfillListingCoordinates(options?: {
  limit?: number;
  dryRun?: boolean;
}): Promise<{ result: Awaited<ReturnType<typeof backfillListingCoordinatesBatch>>; error?: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return {
      result: {
        scanned: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        dryRun: options?.dryRun ?? true,
        errors: [auth.error ?? "Unauthorized."],
      },
      error: auth.error ?? "Unauthorized.",
    };
  }

  const result = await backfillListingCoordinatesBatch(auth.supabase, {
    limit: options?.limit,
    dryRun: options?.dryRun ?? false,
  });

  return { result };
}
