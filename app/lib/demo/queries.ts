import type { SupabaseClient } from "@supabase/supabase-js";
import type { DemoEnvironmentSnapshot, DemoOrganization } from "@/app/types/demo";
import { DEMO_ORGANIZATION_SLUG } from "@/app/lib/demo/constants";
import { fetchDemoUserState } from "@/app/lib/demo/preferences";

type OrganizationRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

type MemberRow = {
  id: string;
  role: "owner" | "trainer" | "vet" | "farrier";
  display_name: string;
  title: string;
  contact_email: string | null;
};

export async function fetchDemoOrganization(
  supabase: SupabaseClient
): Promise<{ organization: DemoOrganization | null; error?: string }> {
  const { data: orgRow, error: orgError } = await supabase
    .from("demo_organizations")
    .select("id, slug, name, description")
    .eq("slug", DEMO_ORGANIZATION_SLUG)
    .maybeSingle();

  if (orgError) {
    return { organization: null, error: orgError.message };
  }

  if (!orgRow) {
    return { organization: null };
  }

  const organization = orgRow as OrganizationRow;

  const { data: memberRows, error: memberError } = await supabase
    .from("demo_organization_members")
    .select("id, role, display_name, title, contact_email")
    .eq("organization_id", organization.id)
    .order("role", { ascending: true });

  if (memberError) {
    return { organization: null, error: memberError.message };
  }

  return {
    organization: {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      description: organization.description,
      members: ((memberRows ?? []) as MemberRow[]).map((member) => ({
        id: member.id,
        role: member.role,
        displayName: member.display_name,
        title: member.title,
        contactEmail: member.contact_email,
      })),
    },
  };
}

export async function fetchDemoEnvironmentSnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<{ snapshot: DemoEnvironmentSnapshot; error?: string }> {
  const [organizationResult, userStateResult] = await Promise.all([
    fetchDemoOrganization(supabase),
    fetchDemoUserState(supabase, userId),
  ]);

  if (organizationResult.error) {
    return {
      snapshot: {
        organization: null,
        userState: userStateResult.state,
        demoHorses: [],
      },
      error: organizationResult.error,
    };
  }

  if (userStateResult.error) {
    return {
      snapshot: {
        organization: organizationResult.organization,
        userState: userStateResult.state,
        demoHorses: [],
      },
      error: userStateResult.error,
    };
  }

  let demoHorses: DemoEnvironmentSnapshot["demoHorses"] = [];

  if (userStateResult.state.demoHorseIds.length > 0) {
    const { data: horseRows, error: horseError } = await supabase
      .from("pedigree_horses")
      .select("id, name")
      .in("id", userStateResult.state.demoHorseIds)
      .order("name", { ascending: true });

    if (horseError) {
      return {
        snapshot: {
          organization: organizationResult.organization,
          userState: userStateResult.state,
          demoHorses: [],
        },
        error: horseError.message,
      };
    }

    const listingDisciplines = new Map<string, string>();
    const { data: listingRows } = await supabase
      .from("horse_listings")
      .select("pedigree_horse_id, discipline")
      .eq("user_id", userId)
      .in("pedigree_horse_id", userStateResult.state.demoHorseIds);

    for (const row of listingRows ?? []) {
      if (row.pedigree_horse_id) {
        listingDisciplines.set(row.pedigree_horse_id as string, row.discipline as string);
      }
    }

    demoHorses = (horseRows ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      discipline: listingDisciplines.get(row.id as string) ?? "—",
    }));
  }

  return {
    snapshot: {
      organization: organizationResult.organization,
      userState: userStateResult.state,
      demoHorses,
    },
  };
}
