"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/lib/admin";
import {
  formatPedigreeIdentityLine,
  getPedigreeLinkedCoverUrl,
  loadPedigreeTree,
  rowToPedigreeHorse,
} from "@/app/lib/pedigree";
import { createClient } from "@/app/lib/supabase/server";
import {
  PedigreeProfileLinks,
  PedigreeSearchResult,
  PedigreeTreeNode,
} from "@/app/types/pedigree";

async function fetchPedigreeCoverImageMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pedigreeHorseIds: string[]
): Promise<Map<string, string>> {
  const coverMap = new Map<string, string>();
  if (pedigreeHorseIds.length === 0) {
    return coverMap;
  }

  const [{ data: stallionRows }, { data: listingRows }] = await Promise.all([
    supabase
      .from("stallions")
      .select("pedigree_horse_id, cover_image_url, image_urls")
      .in("pedigree_horse_id", pedigreeHorseIds)
      .eq("status", "active"),
    supabase
      .from("horse_listings")
      .select("pedigree_horse_id, cover_image_url, image_urls")
      .in("pedigree_horse_id", pedigreeHorseIds)
      .eq("status", "active"),
  ]);

  for (const row of stallionRows ?? []) {
    const pedigreeHorseId = row.pedigree_horse_id as string | null;
    if (!pedigreeHorseId || coverMap.has(pedigreeHorseId)) continue;

    const coverUrl = getPedigreeLinkedCoverUrl(row);
    if (coverUrl) {
      coverMap.set(pedigreeHorseId, coverUrl);
    }
  }

  for (const row of listingRows ?? []) {
    const pedigreeHorseId = row.pedigree_horse_id as string | null;
    if (!pedigreeHorseId || coverMap.has(pedigreeHorseId)) continue;

    const coverUrl = getPedigreeLinkedCoverUrl(row);
    if (coverUrl) {
      coverMap.set(pedigreeHorseId, coverUrl);
    }
  }

  return coverMap;
}

export async function getPedigreeHorseById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pedigree_horses").select("*").eq("id", id).maybeSingle();

  if (error || !data) {
    return { horse: null, error: error?.message };
  }

  return { horse: rowToPedigreeHorse(data as Record<string, unknown>) };
}

export async function getPedigreeTreeById(id: string): Promise<{
  tree: PedigreeTreeNode | null;
  error?: string;
}> {
  const supabase = await createClient();
  const tree = await loadPedigreeTree(supabase, id);
  return { tree };
}

export async function getPedigreeProfile(id: string) {
  const supabase = await createClient();
  const [horseResult, treeResult] = await Promise.all([
    getPedigreeHorseById(id),
    getPedigreeTreeById(id),
  ]);

  if (!horseResult.horse) {
    return { profile: null };
  }

  const horse = horseResult.horse;
  const tree = treeResult.tree;
  let sireName: string | null = null;
  let damName: string | null = null;

  if (horse.sireId) {
    const { data } = await supabase
      .from("pedigree_horses")
      .select("name")
      .eq("id", horse.sireId)
      .maybeSingle();
    sireName = (data?.name as string | undefined) ?? null;
  }

  if (horse.damId) {
    const { data } = await supabase
      .from("pedigree_horses")
      .select("name")
      .eq("id", horse.damId)
      .maybeSingle();
    damName = (data?.name as string | undefined) ?? null;
  }

  const [{ data: listingLink }, { data: stallionLink }] = await Promise.all([
    supabase
      .from("horse_listings")
      .select("id, cover_image_url, image_urls")
      .eq("pedigree_horse_id", id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("stallions")
      .select("id, cover_image_url, image_urls")
      .eq("pedigree_horse_id", id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
  ]);

  const links: PedigreeProfileLinks = {
    listingId: (listingLink?.id as string | undefined) ?? null,
    stallionId: (stallionLink?.id as string | undefined) ?? null,
  };

  const coverImageUrl =
    getPedigreeLinkedCoverUrl(stallionLink ?? {}) ??
    getPedigreeLinkedCoverUrl(listingLink ?? {});

  return {
    profile: {
      horse,
      tree,
      sireName,
      damName,
      links,
      coverImageUrl,
    },
  };
}

export async function getPedigreeSectionForListing(listing: {
  pedigree_horse_id?: string | null;
  name: string;
  gender: string;
  sire: string;
  dam: string;
  dam_sire: string;
}) {
  if (listing.pedigree_horse_id) {
    const { tree } = await getPedigreeTreeById(listing.pedigree_horse_id);
    if (tree) {
      return {
        tree,
        subjectName: listing.name,
        legacy: null,
      };
    }
  }

  return {
    tree: null,
    subjectName: listing.name,
    legacy: {
      sire: listing.sire,
      dam: listing.dam,
      damSire: listing.dam_sire,
    },
  };
}

export async function getPedigreeSectionForStallion(stallion: {
  pedigree_horse_id?: string | null;
  name: string;
  sire: string;
  dam: string;
  dam_sire: string;
}) {
  if (stallion.pedigree_horse_id) {
    const { tree } = await getPedigreeTreeById(stallion.pedigree_horse_id);
    if (tree) {
      return {
        tree,
        subjectName: stallion.name,
        legacy: null,
      };
    }
  }

  return {
    tree: null,
    subjectName: stallion.name,
    legacy: {
      sire: stallion.sire,
      dam: stallion.dam,
      damSire: stallion.dam_sire,
    },
  };
}

export async function searchBloodlines(input: {
  query?: string;
  studbook?: string;
  registrationNumber?: string;
}) {
  const supabase = await createClient();
  const query = input.query?.trim() ?? "";
  const studbook = input.studbook?.trim() ?? "";
  const registrationNumber = input.registrationNumber?.trim() ?? "";

  if (!query && !studbook && !registrationNumber) {
    return { results: [] as PedigreeSearchResult[] };
  }

  let request = supabase
    .from("pedigree_horses")
    .select("id, name, sex, birth_year, studbook, registration_number, verified, sire_id, dam_id")
    .order("name", { ascending: true })
    .limit(50);

  if (registrationNumber) {
    request = request.ilike("registration_number", `%${registrationNumber}%`);
  }

  if (studbook) {
    request = request.ilike("studbook", `%${studbook}%`);
  }

  if (query) {
    request = request.or(`name.ilike.%${query}%,normalized_name.ilike.%${query.replace(/\s+/g, "%")}%`);
  }

  const { data, error } = await request;

  if (error || !data) {
    return { results: [], error: error?.message };
  }

  const rows = data as Array<Record<string, unknown>>;
  const relatedIds = [
    ...rows.map((row) => row.sire_id).filter(Boolean),
    ...rows.flatMap((row) => [row.dam_id]).filter(Boolean),
  ] as string[];

  const uniqueRelatedIds = [...new Set(relatedIds)];
  const relatedNames = new Map<string, string>();

  if (uniqueRelatedIds.length > 0) {
    const { data: relatedRows } = await supabase
      .from("pedigree_horses")
      .select("id, name, sire_id")
      .in("id", uniqueRelatedIds);

    for (const related of relatedRows ?? []) {
      relatedNames.set(related.id as string, related.name as string);
    }
  }

  const damSireIds = [...new Set((rows.map((row) => row.dam_id).filter(Boolean) as string[]))];
  const damRows = damSireIds.length
    ? (
        await supabase
          .from("pedigree_horses")
          .select("id, sire_id")
          .in("id", damSireIds)
      ).data ?? []
    : [];

  const damSireMap = new Map<string, string | null>();
  for (const damRow of damRows) {
    const damSireId = damRow.sire_id as string | null;
    damSireMap.set(
      damRow.id as string,
      damSireId ? relatedNames.get(damSireId) ?? null : null
    );
  }

  const results: PedigreeSearchResult[] = rows.map((row) => {
    const horse = rowToPedigreeHorse(row);
    const sireName = horse.sireId ? relatedNames.get(horse.sireId) ?? null : null;
    const damSireName = horse.damId ? damSireMap.get(horse.damId) ?? null : null;

    return {
      id: horse.id,
      name: horse.name,
      sex: horse.sex,
      birthYear: horse.birthYear,
      studbook: horse.studbook,
      registrationNumber: horse.registrationNumber,
      sireName,
      damSireName,
      verified: horse.verified,
      coverImageUrl: null,
    };
  });

  const coverMap = await fetchPedigreeCoverImageMap(
    supabase,
    results.map((result) => result.id)
  );

  for (const result of results) {
    result.coverImageUrl = coverMap.get(result.id) ?? null;
  }

  return { results };
}

function revalidatePedigreePaths(id: string) {
  revalidatePath("/bloodlines");
  revalidatePath("/admin/pedigree");
  revalidatePath(`/pedigree/${id}`);
}

export async function setPedigreeHorseVerified(pedigreeHorseId: string, verified: boolean) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("pedigree_horses")
    .update({ verified })
    .eq("id", pedigreeHorseId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Pedigree record not found or could not be updated." };
  }

  revalidatePedigreePaths(pedigreeHorseId);
  return { data: true };
}

export async function getAdminPedigreeRecords(filter: "all" | "verified" | "pending" = "all") {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { records: [], error: auth.error ?? "Forbidden" };
  }

  let query = auth.supabase
    .from("pedigree_horses")
    .select("id, name, sex, birth_year, studbook, registration_number, verified, created_at, sire_id, dam_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter === "verified") query = query.eq("verified", true);
  if (filter === "pending") query = query.eq("verified", false);

  const { data, error } = await query;
  if (error || !data) {
    return { records: [], error: error?.message };
  }

  return {
    records: data.map((row) => {
      const horse = rowToPedigreeHorse(row as Record<string, unknown>);
      return {
        id: horse.id,
        name: horse.name,
        sex: horse.sex,
        birthYear: horse.birthYear,
        studbook: horse.studbook,
        registrationNumber: horse.registrationNumber,
        verified: horse.verified,
        createdAt: horse.createdAt,
        identityLine: formatPedigreeIdentityLine({
          name: horse.name,
          birthYear: horse.birthYear,
          sex: horse.sex,
          studbook: horse.studbook,
        }),
      };
    }),
  };
}
