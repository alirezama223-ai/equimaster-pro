import type { SupabaseClient } from "@supabase/supabase-js";
import type { Horse } from "@/app/data/horses";
import { fetchHorseHealthDashboard } from "@/app/lib/health/horse-health";
import { listingRowToHorse } from "@/app/lib/horse-listings";
import { getPublicListingPath } from "@/app/lib/marketplace/paths";
import { buildListingSlug } from "@/app/lib/marketplace/slug";
import { formatPedigreeSexLabel, rowToPedigreeHorse } from "@/app/lib/pedigree";
import { fetchHorseTrainingAnalytics } from "@/app/lib/training/horse-analytics";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type {
  PublicHealthSummarySnapshot,
  PublicListingProfile,
  PublicTrainingSummarySnapshot,
} from "@/app/types/marketplace-public";
import type { PedigreeHorse } from "@/app/types/pedigree";

function parseTrainingSnapshot(value: unknown): PublicTrainingSummarySnapshot | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    totalSessions: Number(row.totalSessions ?? 0),
    completedSessions: Number(row.completedSessions ?? 0),
    completionRateLabel: String(row.completionRateLabel ?? "0%"),
    averageRating:
      row.averageRating === null || row.averageRating === undefined
        ? null
        : Number(row.averageRating),
    currentTrainingStreak: Number(row.currentTrainingStreak ?? 0),
    lastSessionDateLabel:
      row.lastSessionDateLabel === null || row.lastSessionDateLabel === undefined
        ? null
        : String(row.lastSessionDateLabel),
  };
}

function parseHealthSnapshot(value: unknown): PublicHealthSummarySnapshot | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    latestCheckDate:
      row.latestCheckDate === null || row.latestCheckDate === undefined
        ? null
        : String(row.latestCheckDate),
    activeInjuryCount: Number(row.activeInjuryCount ?? 0),
    overdueVaccinationCount: Number(row.overdueVaccinationCount ?? 0),
    readinessScore:
      row.readinessScore === null || row.readinessScore === undefined
        ? null
        : Number(row.readinessScore),
    readinessLabel: String(row.readinessLabel ?? "Not assessed"),
  };
}

export async function fetchPedigreeHorseById(
  supabase: SupabaseClient,
  pedigreeHorseId: string
): Promise<PedigreeHorse | null> {
  const { data, error } = await supabase
    .from("pedigree_horses")
    .select("*")
    .eq("id", pedigreeHorseId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return rowToPedigreeHorse(data as Record<string, unknown>);
}

export function buildPublicListingProfile(
  listing: HorseListingRow,
  pedigreeHorse: PedigreeHorse | null
): PublicListingProfile {
  const horse = listingRowToHorse(listing);

  if (pedigreeHorse) {
    horse.name = pedigreeHorse.name;
    horse.breed = pedigreeHorse.breed ?? horse.breed;
    horse.color = pedigreeHorse.color ?? horse.color;
    horse.country = pedigreeHorse.country ?? horse.country;
    horse.gender = formatPedigreeSexLabel(pedigreeHorse.sex) as Horse["gender"];
    if (pedigreeHorse.birthYear) {
      horse.age = Math.max(new Date().getFullYear() - pedigreeHorse.birthYear, 0);
    }
    if (pedigreeHorse.description?.trim()) {
      horse.description = pedigreeHorse.description;
    }
  }

  const publicSlug = listing.slug?.trim() || buildListingSlug(listing.name, listing.id);

  return {
    listing,
    horse,
    pedigreeHorse,
    trainingSummary: parseTrainingSnapshot(
      (listing as HorseListingRow & { public_training_summary?: unknown }).public_training_summary
    ),
    healthSummary: parseHealthSnapshot(
      (listing as HorseListingRow & { public_health_summary?: unknown }).public_health_summary
    ),
    publicUrl: getPublicListingPath(publicSlug),
  };
}

export async function refreshListingPublicSnapshots(
  supabase: SupabaseClient,
  userId: string,
  listing: HorseListingRow
): Promise<{ error?: string }> {
  if (!listing.pedigree_horse_id) {
    await supabase
      .from("horse_listings")
      .update({
        public_training_summary: null,
        public_health_summary: null,
      })
      .eq("id", listing.id)
      .eq("user_id", userId);
    return {};
  }

  const horseId = listing.pedigree_horse_id;
  const horseName = listing.name;

  const [analyticsResult, healthResult] = await Promise.all([
    fetchHorseTrainingAnalytics(supabase, userId, horseId, horseName),
    fetchHorseHealthDashboard(supabase, userId, horseId, horseName),
  ]);

  const trainingSummary: PublicTrainingSummarySnapshot | null =
    analyticsResult.analytics.summary.totalSessions > 0
      ? {
          totalSessions: analyticsResult.analytics.summary.totalSessions,
          completedSessions: analyticsResult.analytics.summary.completedSessions,
          completionRateLabel: analyticsResult.analytics.summary.completionRateLabel,
          averageRating: analyticsResult.analytics.summary.averageRating,
          currentTrainingStreak: analyticsResult.analytics.summary.currentTrainingStreak,
          lastSessionDateLabel: analyticsResult.analytics.summary.lastSessionDateLabel,
        }
      : null;

  const healthSummary: PublicHealthSummarySnapshot | null = healthResult.dashboard
    ? {
        latestCheckDate: healthResult.dashboard.snapshot.latestCheck?.checkDate ?? null,
        activeInjuryCount: healthResult.dashboard.snapshot.activeInjuries.length,
        overdueVaccinationCount: healthResult.dashboard.snapshot.overdueVaccinations.length,
        readinessScore: healthResult.dashboard.evaluation.healthScore,
        readinessLabel: healthResult.dashboard.evaluation.primaryAlert?.title ?? "Healthy",
      }
    : null;

  const { error } = await supabase
    .from("horse_listings")
    .update({
      public_training_summary: trainingSummary,
      public_health_summary: healthSummary,
    })
    .eq("id", listing.id)
    .eq("user_id", userId);

  return error ? { error: error.message } : {};
}

async function findLegacyActiveListingByCanonicalSlug(
  supabase: SupabaseClient,
  slug: string
): Promise<HorseListingRow | null> {
  const { data, error } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("status", "active")
    .is("slug", null)
    .limit(100);

  if (error) return null;

  return (
    ((data ?? []) as HorseListingRow[]).find(
      (candidate) => buildListingSlug(candidate.name, candidate.id) === slug
    ) ?? null
  );
}

async function findLegacyOwnerListingByCanonicalSlug(
  supabase: SupabaseClient,
  slug: string,
  ownerUserId: string
): Promise<HorseListingRow | null> {
  const { data, error } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("user_id", ownerUserId)
    .is("slug", null)
    .limit(100);

  if (error) return null;

  return (
    ((data ?? []) as HorseListingRow[]).find(
      (candidate) => buildListingSlug(candidate.name, candidate.id) === slug
    ) ?? null
  );
}

export async function buildPublicListingProfileBySlug(
  supabase: SupabaseClient,
  slug: string,
  options?: { ownerUserId?: string }
): Promise<{ profile: PublicListingProfile | null; isOwnerPreview?: boolean; error?: string }> {
  const { data: activeListing, error: activeError } = await supabase
    .from("horse_listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (activeError) {
    return { profile: null, error: activeError.message };
  }

  let listing = activeListing as HorseListingRow | null;
  let isOwnerPreview = false;

  // Legacy rows can still have a null stored slug. Resolve the canonical
  // fallback slug generated from name + listing id so old listings remain reachable.
  if (!listing) {
    listing = await findLegacyActiveListingByCanonicalSlug(supabase, slug);
  }

  if (!listing && options?.ownerUserId) {
    const { data: ownerListing } = await supabase
      .from("horse_listings")
      .select("*")
      .eq("slug", slug)
      .eq("user_id", options.ownerUserId)
      .maybeSingle();

    listing = (ownerListing as HorseListingRow | null) ?? null;

    if (!listing) {
      listing = await findLegacyOwnerListingByCanonicalSlug(supabase, slug, options.ownerUserId);
    }

    isOwnerPreview = Boolean(listing && listing.status !== "active");
  }

  if (!listing) {
    return { profile: null };
  }

  const pedigreeHorse = listing.pedigree_horse_id
    ? await fetchPedigreeHorseById(supabase, listing.pedigree_horse_id)
    : null;

  return {
    profile: buildPublicListingProfile(listing, pedigreeHorse),
    isOwnerPreview,
  };
}
