"use server";

import { revalidatePath } from "next/cache";
import { formatOwnerReference, isCurrentUserAdmin, requireAdmin, type AdminVerificationFilter } from "@/app/lib/admin";
import { getBreederLogoUrl, rowToBreeder } from "@/app/lib/breeders";
import { getStallionCoverUrl, rowToStallion } from "@/app/lib/stallions";

export type AdminDashboardStats = {
  activeListings: number;
  totalBreeders: number;
  totalStallions: number;
  verifiedBreeders: number;
  verifiedStallions: number;
  pendingBreeders: number;
  pendingStallions: number;
  totalPedigreeHorses: number;
  verifiedPedigreeHorses: number;
  pendingPedigreeHorses: number;
};

export type AdminBreederListItem = {
  id: string;
  name: string;
  ownerId: string;
  ownerReference: string;
  country: string;
  city: string | null;
  logoUrl: string;
  createdAt: string;
  verified: boolean;
  status: string;
};

export type AdminStallionListItem = {
  id: string;
  name: string;
  ownerId: string;
  ownerReference: string;
  breederId: string;
  breederName: string;
  breed: string;
  country: string;
  coverImageUrl: string;
  createdAt: string;
  verified: boolean;
  status: string;
};

function revalidateBreederVerificationPaths(breederId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/breeders");
  revalidatePath("/breeders");
  revalidatePath(`/breeders/${breederId}`);
}

function revalidateStallionVerificationPaths(stallionId: string, breederId?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/stallions");
  revalidatePath("/stallions");
  revalidatePath(`/stallions/${stallionId}`);
  if (breederId) {
    revalidatePath(`/breeders/${breederId}`);
  }
}

export async function getAdminDashboardStats(): Promise<{
  stats: AdminDashboardStats | null;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { stats: null, error: auth.error ?? "Forbidden" };
  }

  const supabase = auth.supabase;

  const [
    { count: activeListings },
    { data: breeders },
    { data: stallions },
    { data: pedigreeHorses },
  ] = await Promise.all([
    supabase
      .from("horse_listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("breeders").select("verified, status").neq("status", "archived"),
    supabase.from("stallions").select("verified, status").neq("status", "archived"),
    supabase.from("pedigree_horses").select("verified"),
  ]);

  const breederRows = breeders ?? [];
  const stallionRows = stallions ?? [];
  const pedigreeRows = pedigreeHorses ?? [];

  return {
    stats: {
      activeListings: activeListings ?? 0,
      totalBreeders: breederRows.length,
      totalStallions: stallionRows.length,
      verifiedBreeders: breederRows.filter((row) => row.verified).length,
      verifiedStallions: stallionRows.filter((row) => row.verified).length,
      pendingBreeders: breederRows.filter((row) => !row.verified).length,
      pendingStallions: stallionRows.filter((row) => !row.verified).length,
      totalPedigreeHorses: pedigreeRows.length,
      verifiedPedigreeHorses: pedigreeRows.filter((row) => row.verified).length,
      pendingPedigreeHorses: pedigreeRows.filter((row) => !row.verified).length,
    },
  };
}

export async function getAdminBreeders(filter: AdminVerificationFilter = "all"): Promise<{
  breeders: AdminBreederListItem[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { breeders: [], error: auth.error ?? "Forbidden" };
  }

  let query = auth.supabase
    .from("breeders")
    .select("id, owner_id, name, country, city, logo_url, created_at, verified, status")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (filter === "verified") {
    query = query.eq("verified", true);
  } else if (filter === "pending") {
    query = query.eq("verified", false);
  }

  const { data, error } = await query;

  if (error) {
    return { breeders: [], error: error.message };
  }

  return {
    breeders: (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      ownerId: row.owner_id as string,
      ownerReference: formatOwnerReference(row.owner_id as string),
      country: row.country as string,
      city: (row.city as string | null) ?? null,
      logoUrl: getBreederLogoUrl(rowToBreeder(row as Record<string, unknown>)),
      createdAt: row.created_at as string,
      verified: Boolean(row.verified),
      status: row.status as string,
    })),
  };
}

export async function getAdminStallions(filter: AdminVerificationFilter = "all"): Promise<{
  stallions: AdminStallionListItem[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { stallions: [], error: auth.error ?? "Forbidden" };
  }

  let query = auth.supabase
    .from("stallions")
    .select(
      "id, owner_id, breeder_id, name, breed, country, cover_image_url, image_urls, created_at, verified, status, breeders(name)"
    )
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (filter === "verified") {
    query = query.eq("verified", true);
  } else if (filter === "pending") {
    query = query.eq("verified", false);
  }

  const { data, error } = await query;

  if (error) {
    return { stallions: [], error: error.message };
  }

  return {
    stallions: (data ?? []).map((row) => {
      const stallion = rowToStallion(row as Record<string, unknown>);
      const breederJoin = row.breeders as { name?: string } | { name?: string }[] | null;
      const breederName = Array.isArray(breederJoin)
        ? breederJoin[0]?.name ?? "Unknown stud farm"
        : breederJoin?.name ?? "Unknown stud farm";

      return {
        id: stallion.id,
        name: stallion.name,
        ownerId: stallion.owner_id,
        ownerReference: formatOwnerReference(stallion.owner_id),
        breederId: stallion.breeder_id,
        breederName,
        breed: stallion.breed,
        country: stallion.country,
        coverImageUrl: getStallionCoverUrl(stallion),
        createdAt: stallion.created_at,
        verified: stallion.verified,
        status: stallion.status,
      };
    }),
  };
}

export async function setBreederVerified(breederId: string, verified: boolean) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("breeders")
    .update({ verified })
    .eq("id", breederId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Breeder not found or could not be updated." };
  }

  revalidateBreederVerificationPaths(breederId);
  return { data: true };
}

export async function setStallionVerified(stallionId: string, verified: boolean) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { data: existing } = await auth.supabase
    .from("stallions")
    .select("breeder_id")
    .eq("id", stallionId)
    .maybeSingle();

  const { data, error } = await auth.supabase
    .from("stallions")
    .update({ verified })
    .eq("id", stallionId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Stallion not found or could not be updated." };
  }

  revalidateStallionVerificationPaths(
    stallionId,
    (existing?.breeder_id as string | undefined) ?? null
  );
  return { data: true };
}

export async function checkIsCurrentUserAdmin(): Promise<boolean> {
  return isCurrentUserAdmin();
}
