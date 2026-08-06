"use server";

import { revalidatePath } from "next/cache";
import { formatOwnerReference, requireAdmin } from "@/app/lib/admin";
import { formatListingRowPrice } from "@/app/lib/horse-listings";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type {
  AdminAnalyticsStats,
  AdminListingFilter,
  AdminListingListItem,
  AdminMarketplaceSettings,
  AdminReportSummary,
  AdminSellerListItem,
  AdminUserFilter,
  AdminUserListItem,
} from "@/app/types/admin-panel";
import {
  ADMIN_LISTINGS_PAGE_SIZE,
  ADMIN_USERS_PAGE_SIZE,
} from "@/app/types/admin-panel";
import { getAdminDashboardStats } from "@/app/actions/admin";

const DEFAULT_SETTINGS: AdminMarketplaceSettings = {
  maintenance_mode: false,
  require_listing_review: false,
  support_email: "support@equimaster.pro",
  welcome_message: "Welcome to EquiMaster Pro.",
  homepage_hero: {
    title: "Find your next champion",
    subtitle: "Premium horses, verified sellers, and trusted breeders worldwide.",
    cta_label: "Browse marketplace",
    cta_href: "/marketplace",
  },
  featured_breeds: [],
  featured_stallions: [],
  feature_flags: {
    enable_messaging: true,
    enable_favorites: true,
    enable_seller_verification: true,
    enable_listing_moderation: true,
  },
};

function revalidateAdminPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/sellers");
  revalidatePath("/admin/verification");
  revalidatePath("/admin/messages");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/notifications");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/settings");
}

import { mapListingRow } from "@/app/lib/admin-listing-mapper";

export async function getAdminAnalyticsStats(): Promise<{
  stats: AdminAnalyticsStats | null;
  error?: string;
}> {
  const { getAdminEnterpriseStats } = await import("@/app/actions/admin-enterprise");
  return getAdminEnterpriseStats();
}

export async function getAdminUsers(
  page = 1,
  filter: AdminUserFilter = "all",
  search = "",
  sort: "newest" | "oldest" | "most_listings" = "newest"
): Promise<{
  users: AdminUserListItem[];
  hasMore: boolean;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { users: [], hasMore: false, error: auth.error ?? "Forbidden" };
  }

  const safePage = Math.max(page, 1);
  const from = (safePage - 1) * ADMIN_USERS_PAGE_SIZE;
  const to = from + ADMIN_USERS_PAGE_SIZE;

  let query = auth.supabase
    .from("profiles")
    .select(
      "user_id, role, seller_verified, account_status, country, seller_verification_status, created_at, updated_at"
    )
    .range(from, to);

  if (sort === "newest") query = query.order("created_at", { ascending: false });
  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  if (sort === "most_listings") query = query.order("updated_at", { ascending: false });

  if (filter === "admin") {
    query = query.eq("role", "admin");
  } else if (filter === "verified_seller") {
    query = query.eq("seller_verified", true);
  } else if (filter === "suspended") {
    query = query.eq("account_status", "suspended");
  } else if (filter === "banned") {
    query = query.eq("account_status", "banned");
  } else if (filter === "pending_verification") {
    query = query.eq("seller_verification_status", "pending");
  }

  const { data, error } = await query;
  if (error) {
    return { users: [], hasMore: false, error: error.message };
  }

  const rows = data ?? [];
  const userIds = rows.map((row) => row.user_id as string);

  let listingCounts = new Map<string, { total: number; active: number }>();
  if (userIds.length > 0) {
    const { data: listings } = await auth.supabase
      .from("horse_listings")
      .select("user_id, status")
      .in("user_id", userIds);

    for (const listing of listings ?? []) {
      const userId = listing.user_id as string;
      const existing = listingCounts.get(userId) ?? { total: 0, active: 0 };
      existing.total += 1;
      if (listing.status === "active") existing.active += 1;
      listingCounts.set(userId, existing);
    }
  }

  const fetched = rows.map((row) => {
    const counts = listingCounts.get(row.user_id as string) ?? { total: 0, active: 0 };
    return {
      userId: row.user_id as string,
      role: row.role === "admin" ? "admin" : "user",
      accountStatus:
        row.account_status === "suspended" || row.account_status === "banned"
          ? row.account_status
          : "active",
      country: (row.country as string | null) ?? null,
      sellerVerified: Boolean(row.seller_verified),
      sellerVerificationStatus:
        row.seller_verification_status === "pending" ||
        row.seller_verification_status === "verified" ||
        row.seller_verification_status === "rejected"
          ? row.seller_verification_status
          : "unverified",
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      listingCount: counts.total,
      activeListingCount: counts.active,
    } satisfies AdminUserListItem;
  });

  let users = fetched;
  if (filter === "seller") {
    users = users.filter((user) => user.listingCount > 0);
  }

  const normalizedSearch = search.trim().toLowerCase();
  if (normalizedSearch) {
    users = users.filter((user) => user.userId.toLowerCase().includes(normalizedSearch));
  }

  if (sort === "most_listings") {
    users = [...users].sort((a, b) => b.listingCount - a.listingCount);
  }

  const hasMore = rows.length > ADMIN_USERS_PAGE_SIZE;

  return {
    users: hasMore ? users.slice(0, ADMIN_USERS_PAGE_SIZE) : users,
    hasMore,
  };
}

export async function setAdminUserRole(userId: string, role: "user" | "admin") {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { error: auth.error ?? "Forbidden" };
  }

  if (auth.user.id === userId && role !== "admin") {
    return { error: "You cannot remove your own admin access." };
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminPaths();
  return { success: true as const };
}

export async function setAdminSellerVerified(userId: string, sellerVerified: boolean) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update({ seller_verified: sellerVerified })
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminPaths();
  return { success: true as const };
}

export async function getAdminListings(
  page = 1,
  filter: AdminListingFilter = "all",
  search = "",
  sort: "newest" | "oldest" | "most_views" | "updated" = "updated"
): Promise<{
  listings: AdminListingListItem[];
  hasMore: boolean;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { listings: [], hasMore: false, error: auth.error ?? "Forbidden" };
  }

  const safePage = Math.max(page, 1);
  const from = (safePage - 1) * ADMIN_LISTINGS_PAGE_SIZE;
  const to = from + ADMIN_LISTINGS_PAGE_SIZE;

  let query = auth.supabase
    .from("horse_listings")
    .select("*")
    .range(from, to);

  if (sort === "newest") query = query.order("created_at", { ascending: false });
  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  if (sort === "most_views") query = query.order("view_count", { ascending: false });
  if (sort === "updated") query = query.order("updated_at", { ascending: false });

  if (filter === "pending") {
    query = query.eq("status", "draft");
  } else if (filter === "rejected") {
    query = query.not("rejection_reason", "is", null);
  } else if (filter === "featured") {
    query = query.eq("featured", true);
  } else if (filter === "hidden") {
    query = query.eq("hidden", true);
  } else if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const normalizedSearch = search.trim();
  if (normalizedSearch) {
    query = query.or(
      `name.ilike.%${normalizedSearch}%,seller_name.ilike.%${normalizedSearch}%,breed.ilike.%${normalizedSearch}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    return { listings: [], hasMore: false, error: error.message };
  }

  const rows = (data ?? []) as HorseListingRow[];
  const hasMore = rows.length > ADMIN_LISTINGS_PAGE_SIZE;
  const listings = (hasMore ? rows.slice(0, ADMIN_LISTINGS_PAGE_SIZE) : rows).map((row) =>
    mapListingRow(row, "Price on request")
  );

  return { listings, hasMore };
}

export async function moderateAdminListing(
  listingId: string,
  action: "approve" | "archive" | "restore" | "toggle_verified"
) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { data: listing, error: fetchError } = await auth.supabase
    .from("horse_listings")
    .select("id, status, verified")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchError || !listing) {
    return { error: "Listing not found." };
  }

  let patch: Record<string, unknown> = {};

  switch (action) {
    case "approve":
      patch = { status: "active", published_at: new Date().toISOString() };
      break;
    case "archive":
      patch = { status: "archived" };
      break;
    case "restore":
      patch = { status: "draft" };
      break;
    case "toggle_verified":
      patch = { verified: !listing.verified };
      break;
  }

  const { error } = await auth.supabase.from("horse_listings").update(patch).eq("id", listingId);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminPaths();
  revalidatePath("/marketplace");
  revalidatePath("/horses");
  return { success: true as const };
}

export async function getAdminSellers(): Promise<{
  sellers: AdminSellerListItem[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { sellers: [], error: auth.error ?? "Forbidden" };
  }

  const { data: listings, error: listingsError } = await auth.supabase
    .from("horse_listings")
    .select("user_id, status, view_count");

  if (listingsError) {
    return { sellers: [], error: listingsError.message };
  }

  const sellerMap = new Map<
    string,
    { listingCount: number; activeListingCount: number; totalViews: number }
  >();

  for (const listing of listings ?? []) {
    const userId = listing.user_id as string;
    const existing = sellerMap.get(userId) ?? {
      listingCount: 0,
      activeListingCount: 0,
      totalViews: 0,
    };
    existing.listingCount += 1;
    if (listing.status === "active") existing.activeListingCount += 1;
    existing.totalViews += Number(listing.view_count) || 0;
    sellerMap.set(userId, existing);
  }

  const sellerIds = [...sellerMap.keys()];
  if (sellerIds.length === 0) {
    return { sellers: [] };
  }

  const { data: profiles, error: profilesError } = await auth.supabase
    .from("profiles")
    .select(
      "user_id, role, seller_verified, seller_verification_status, seller_verification_documents, seller_verification_notes, created_at"
    )
    .in("user_id", sellerIds)
    .order("created_at", { ascending: false });

  if (profilesError) {
    return { sellers: [], error: profilesError.message };
  }

  const sellers = (profiles ?? []).map((profile) => {
    const metrics = sellerMap.get(profile.user_id as string)!;
    return {
      userId: profile.user_id as string,
      sellerReference: formatOwnerReference(profile.user_id as string),
      sellerVerified: Boolean(profile.seller_verified),
      sellerVerificationStatus:
        profile.seller_verification_status === "pending" ||
        profile.seller_verification_status === "verified" ||
        profile.seller_verification_status === "rejected"
          ? profile.seller_verification_status
          : "unverified",
      sellerVerificationNotes: (profile.seller_verification_notes as string | null) ?? null,
      sellerVerificationDocuments: Array.isArray(profile.seller_verification_documents)
        ? profile.seller_verification_documents
        : [],
      role: profile.role === "admin" ? "admin" : "user",
      listingCount: metrics.listingCount,
      activeListingCount: metrics.activeListingCount,
      totalViews: metrics.totalViews,
      createdAt: profile.created_at as string,
    } satisfies AdminSellerListItem;
  });

  return { sellers };
}

export async function getAdminReportSummary(): Promise<{
  report: AdminReportSummary | null;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { report: null, error: auth.error ?? "Forbidden" };
  }

  const analytics = await getAdminAnalyticsStats();
  if (!analytics.stats) {
    return { report: null, error: analytics.error ?? "Unable to build report." };
  }

  const supabase = auth.supabase;

  const [{ data: listings }, { data: feedback }] = await Promise.all([
    supabase.from("horse_listings").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("feedback_reports").select("status"),
  ]);

  const listingRows = (listings ?? []) as HorseListingRow[];
  const listingsByStatus: Record<string, number> = {};
  for (const listing of listingRows) {
    listingsByStatus[listing.status] = (listingsByStatus[listing.status] ?? 0) + 1;
  }

  const feedbackByStatus: Record<string, number> = {};
  for (const row of feedback ?? []) {
    const status = row.status as string;
    feedbackByStatus[status] = (feedbackByStatus[status] ?? 0) + 1;
  }

  const mapped = listingRows.map((row) => mapListingRow(row, "Price on request"));
  const topViewedListings = [...mapped].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8);

  return {
    report: {
      generatedAt: new Date().toISOString(),
      totals: {
        users: analytics.stats.totalUsers,
        listings: analytics.stats.totalListings,
        activeListings: analytics.stats.activeListings,
        conversations: analytics.stats.totalConversations,
        feedbackOpen: analytics.stats.openFeedbackReports,
        listingViews: analytics.stats.totalListingViews,
      },
      listingsByStatus,
      feedbackByStatus,
      recentListings: mapped.slice(0, 8),
      topViewedListings,
    },
  };
}

export async function getAdminSettings(): Promise<{
  settings: AdminMarketplaceSettings;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { settings: DEFAULT_SETTINGS, error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "marketplace")
    .maybeSingle();

  if (error || !data?.value) {
    return { settings: DEFAULT_SETTINGS, error: error?.message };
  }

  const value = data.value as Partial<AdminMarketplaceSettings>;
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      ...value,
      homepage_hero: { ...DEFAULT_SETTINGS.homepage_hero, ...value.homepage_hero },
      feature_flags: { ...DEFAULT_SETTINGS.feature_flags, ...value.feature_flags },
      featured_breeds: value.featured_breeds ?? DEFAULT_SETTINGS.featured_breeds,
      featured_stallions: value.featured_stallions ?? DEFAULT_SETTINGS.featured_stallions,
    },
  };
}

export async function updateAdminSettings(settings: AdminMarketplaceSettings) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { error } = await auth.supabase.from("admin_settings").upsert(
    {
      key: "marketplace",
      value: settings,
      updated_by: auth.user.id,
    },
    { onConflict: "key" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidateAdminPaths();
  return { success: true as const };
}
