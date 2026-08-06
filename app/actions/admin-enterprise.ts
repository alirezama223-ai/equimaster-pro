"use server";

import { revalidatePath } from "next/cache";
import { formatOwnerReference, requireAdmin } from "@/app/lib/admin";
import { formatListingRowPrice } from "@/app/lib/horse-listings";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type {
  AccountStatus,
  AdminAnalyticsDetail,
  AdminChartPoint,
  AdminConversationListItem,
  AdminDashboardCharts,
  AdminEnterpriseStats,
  AdminMessageListItem,
  AdminSellerListItem,
  BroadcastTarget,
  SellerVerificationStatus,
} from "@/app/types/admin-panel";
import { getAdminDashboardStats } from "@/app/actions/admin";
import { mapListingRow } from "@/app/lib/admin-listing-mapper";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString("en", { month: "short" });
}

function lastMonths(count: number) {
  const keys: string[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - index);
    keys.push(monthKey(date));
  }
  return keys;
}

function bucketByMonth(rows: Array<{ created_at: string }>, keys: string[]): AdminChartPoint[] {
  const counts = new Map(keys.map((key) => [key, 0]));
  for (const row of rows) {
    const key = monthKey(new Date(row.created_at));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return keys.map((key) => ({ label: monthLabel(key), value: counts.get(key) ?? 0 }));
}

function revalidateEnterprisePaths() {
  [
    "/admin",
    "/admin/users",
    "/admin/listings",
    "/admin/sellers",
    "/admin/messages",
    "/admin/feedback",
    "/admin/reports",
    "/admin/notifications",
    "/admin/analytics",
    "/admin/settings",
  ].forEach((path) => revalidatePath(path));
}

export async function getAdminEnterpriseStats(): Promise<{
  stats: AdminEnterpriseStats | null;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { stats: null, error: auth.error ?? "Forbidden" };
  }

  const base = await getAdminDashboardStats();
  if (!base.stats) {
    return { stats: null, error: base.error ?? "Unable to load dashboard stats." };
  }

  const supabase = auth.supabase;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [
    { count: totalUsers },
    { count: newUsers30d },
    { count: adminUsers },
    { count: verifiedSellers },
    { count: pendingSellers },
    { count: totalListings },
    { count: publishedListings },
    { count: pendingListings },
    { count: rejectedListings },
    { count: archivedListings },
    { count: soldListings },
    { count: openFeedbackReports },
    { count: totalConversations },
    { count: totalMessages },
    { count: totalNotifications },
    { count: totalFavorites },
    listingsViewsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("seller_verified", true),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("seller_verification_status", "pending"),
    supabase.from("horse_listings").select("id", { count: "exact", head: true }),
    supabase.from("horse_listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("horse_listings").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("horse_listings").select("id", { count: "exact", head: true }).not("rejection_reason", "is", null),
    supabase.from("horse_listings").select("id", { count: "exact", head: true }).eq("status", "archived"),
    supabase.from("horse_listings").select("id", { count: "exact", head: true }).eq("status", "sold"),
    supabase
      .from("feedback_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    supabase.from("notifications").select("id", { count: "exact", head: true }),
    supabase.from("favorites").select("id", { count: "exact", head: true }),
    supabase.from("horse_listings").select("view_count"),
  ]);

  const totalListingViews = (listingsViewsResult.data ?? []).reduce(
    (sum, row) => sum + (Number(row.view_count) || 0),
    0
  );

  return {
    stats: {
      ...base.stats,
      totalUsers: totalUsers ?? 0,
      newUsers30d: newUsers30d ?? 0,
      adminUsers: adminUsers ?? 0,
      verifiedSellers: verifiedSellers ?? 0,
      pendingSellers: pendingSellers ?? 0,
      totalListings: totalListings ?? 0,
      publishedListings: publishedListings ?? 0,
      pendingListings: pendingListings ?? 0,
      rejectedListings: rejectedListings ?? 0,
      archivedListings: archivedListings ?? 0,
      soldListings: soldListings ?? 0,
      openFeedbackReports: openFeedbackReports ?? 0,
      totalConversations: totalConversations ?? 0,
      totalMessages: totalMessages ?? 0,
      totalNotifications: totalNotifications ?? 0,
      totalFavorites: totalFavorites ?? 0,
      totalListingViews,
    },
  };
}

export async function getAdminDashboardCharts(): Promise<{
  charts: AdminDashboardCharts | null;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { charts: null, error: auth.error ?? "Forbidden" };
  }

  const keys = lastMonths(6);
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  const sinceIso = since.toISOString();

  const [{ data: listings }, { data: profiles }, { data: messages }, { data: views }] = await Promise.all([
    auth.supabase.from("horse_listings").select("created_at, country").gte("created_at", sinceIso),
    auth.supabase.from("profiles").select("created_at").gte("created_at", sinceIso),
    auth.supabase.from("messages").select("created_at").gte("created_at", sinceIso),
    auth.supabase.from("listing_views").select("created_at").gte("created_at", sinceIso),
  ]);

  const countryCounts = new Map<string, number>();
  for (const listing of listings ?? []) {
    const country = String(listing.country ?? "Unknown");
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
  }

  const listingsByCountry = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  return {
    charts: {
      listingsPerMonth: bucketByMonth(listings ?? [], keys),
      newUsersPerMonth: bucketByMonth(profiles ?? [], keys),
      messagesPerMonth: bucketByMonth(messages ?? [], keys),
      viewsPerMonth: bucketByMonth(views ?? [], keys),
      listingsByCountry,
    },
  };
}

export async function setAdminUserAccountStatus(userId: string, accountStatus: AccountStatus) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { error: auth.error ?? "Forbidden" };
  }

  if (auth.user.id === userId && accountStatus !== "active") {
    return { error: "You cannot suspend or ban your own account." };
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update({ account_status: accountStatus })
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidateEnterprisePaths();
  return { success: true as const };
}

export async function deleteAdminUser(userId: string) {
  return setAdminUserAccountStatus(userId, "banned");
}

export async function moderateAdminListingAdvanced(
  listingId: string,
  action:
    | "approve"
    | "reject"
    | "archive"
    | "restore"
    | "toggle_verified"
    | "toggle_featured"
    | "toggle_hidden"
    | "delete",
  reason?: string
) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { data: listing, error: fetchError } = await auth.supabase
    .from("horse_listings")
    .select("id, status, verified, featured, hidden")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchError || !listing) {
    return { error: "Listing not found." };
  }

  if (action === "delete") {
    const { error } = await auth.supabase.from("horse_listings").delete().eq("id", listingId);
    if (error) return { error: error.message };
    revalidateEnterprisePaths();
    revalidatePath("/marketplace");
    revalidatePath("/horses");
    return { success: true as const };
  }

  let patch: Record<string, unknown> = {};
  switch (action) {
    case "approve":
      patch = { status: "active", published_at: new Date().toISOString(), rejection_reason: null, hidden: false };
      break;
    case "reject":
      patch = { status: "archived", rejection_reason: reason?.trim() || "Rejected by admin." };
      break;
    case "archive":
      patch = { status: "archived" };
      break;
    case "restore":
      patch = { status: "draft", rejection_reason: null };
      break;
    case "toggle_verified":
      patch = { verified: !listing.verified };
      break;
    case "toggle_featured":
      patch = { featured: !listing.featured };
      break;
    case "toggle_hidden":
      patch = { hidden: !listing.hidden };
      break;
  }

  const { error } = await auth.supabase.from("horse_listings").update(patch).eq("id", listingId);
  if (error) return { error: error.message };

  revalidateEnterprisePaths();
  revalidatePath("/marketplace");
  revalidatePath("/horses");
  return { success: true as const };
}

export async function bulkModerateAdminListings(
  listingIds: string[],
  action: "approve" | "archive" | "delete" | "feature" | "hide"
) {
  for (const listingId of listingIds) {
    if (action === "approve") await moderateAdminListingAdvanced(listingId, "approve");
    if (action === "archive") await moderateAdminListingAdvanced(listingId, "archive");
    if (action === "delete") await moderateAdminListingAdvanced(listingId, "delete");
    if (action === "feature") {
      const auth = await requireAdmin();
      if (auth.supabase) {
        await auth.supabase.from("horse_listings").update({ featured: true }).eq("id", listingId);
      }
    }
    if (action === "hide") {
      const auth = await requireAdmin();
      if (auth.supabase) {
        await auth.supabase.from("horse_listings").update({ hidden: true }).eq("id", listingId);
      }
    }
  }
  revalidateEnterprisePaths();
  return { success: true as const };
}

export async function getAdminSellerVerificationQueue(): Promise<{
  sellers: AdminSellerListItem[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { sellers: [], error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .select(
      "user_id, role, seller_verified, seller_verification_status, seller_verification_documents, seller_verification_notes, created_at"
    )
    .in("seller_verification_status", ["pending", "more_info"])
    .order("updated_at", { ascending: false });

  if (error) return { sellers: [], error: error.message };

  const sellers = (data ?? []).map((profile) => ({
    userId: profile.user_id as string,
    sellerReference: formatOwnerReference(profile.user_id as string),
    sellerVerified: Boolean(profile.seller_verified),
    sellerVerificationStatus: (profile.seller_verification_status ??
      "none") as SellerVerificationStatus,
    sellerVerificationNotes: (profile.seller_verification_notes as string | null) ?? null,
    sellerVerificationDocuments: Array.isArray(profile.seller_verification_documents)
      ? profile.seller_verification_documents
      : [],
      role: profile.role === "admin" ? ("admin" as const) : ("user" as const),
    listingCount: 0,
    activeListingCount: 0,
    totalViews: 0,
    createdAt: profile.created_at as string,
  }));

  return { sellers };
}

export async function reviewSellerVerification(
  userId: string,
  status: SellerVerificationStatus,
  notes?: string
) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const patch: Record<string, unknown> = {
    seller_verification_status: status,
    seller_verification_notes: notes?.trim() || null,
  };

  if (status === "approved") {
    patch.seller_verified = true;
  } else if (status === "rejected") {
    patch.seller_verified = false;
  }

  const { error } = await auth.supabase.from("profiles").update(patch).eq("user_id", userId);
  if (error) return { error: error.message };

  revalidateEnterprisePaths();
  return { success: true as const };
}

export async function getAdminConversations(): Promise<{
  conversations: AdminConversationListItem[];
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { conversations: [], error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, updated_at, horse_listings(name, slug), messages(id)")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return { conversations: [], error: error.message };

  const conversations = (data ?? []).map((row) => {
    const listing = row.horse_listings as { name?: string; slug?: string } | null;
    const messageCount = Array.isArray(row.messages) ? row.messages.length : 0;

    return {
      id: row.id as string,
      buyerReference: formatOwnerReference(row.buyer_id as string),
      sellerReference: formatOwnerReference(row.seller_id as string),
      listingName: listing?.name ?? "Listing",
      listingSlug: listing?.slug ?? "",
      messageCount,
      updatedAt: row.updated_at as string,
    } satisfies AdminConversationListItem;
  });

  return { conversations };
}

export async function getAdminMessages(page = 1): Promise<{
  messages: AdminMessageListItem[];
  hasMore: boolean;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { messages: [], hasMore: false, error: auth.error ?? "Forbidden" };
  }

  const safePage = Math.max(page, 1);
  const from = (safePage - 1) * 30;
  const to = from + 30;

  const { data, error } = await auth.supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at, read_at, conversations(horse_listings(name))")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return { messages: [], hasMore: false, error: error.message };

  const rows = data ?? [];
  const hasMore = rows.length > 30;
  const messages = (hasMore ? rows.slice(0, 30) : rows).map((row) => {
    const conversation = row.conversations as { horse_listings?: { name?: string } } | null;
    return {
      id: row.id as string,
      conversationId: row.conversation_id as string,
      senderReference: formatOwnerReference(row.sender_id as string),
      body: row.body as string,
      listingName: conversation?.horse_listings?.name ?? "Listing",
      createdAt: row.created_at as string,
      readAt: (row.read_at as string | null) ?? null,
    } satisfies AdminMessageListItem;
  });

  return { messages, hasMore };
}

export async function broadcastAdminNotification(input: {
  title: string;
  body: string;
  target: BroadcastTarget;
}) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  let userIds: string[] = [];

  if (input.target === "all") {
    const { data } = await auth.supabase.from("profiles").select("user_id");
    userIds = (data ?? []).map((row) => row.user_id as string);
  } else if (input.target === "admins") {
    const { data } = await auth.supabase.from("profiles").select("user_id").eq("role", "admin");
    userIds = (data ?? []).map((row) => row.user_id as string);
  } else if (input.target === "sellers") {
    const { data: listings } = await auth.supabase.from("horse_listings").select("user_id");
    userIds = [...new Set((listings ?? []).map((row) => row.user_id as string))];
  } else if (input.target === "breeders") {
    const { data } = await auth.supabase.from("breeders").select("owner_id");
    userIds = [...new Set((data ?? []).map((row) => row.owner_id as string))];
  } else if (input.target === "buyers") {
    const { data } = await auth.supabase.from("conversations").select("buyer_id");
    userIds = [...new Set((data ?? []).map((row) => row.buyer_id as string))];
  }

  if (userIds.length === 0) {
    return { error: "No recipients matched the selected target." };
  }

  const { error } = await auth.supabase.rpc("admin_broadcast_notification", {
    p_user_ids: userIds,
    p_title: input.title.trim(),
    p_body: input.body.trim(),
  });

  if (error) return { error: error.message };

  revalidateEnterprisePaths();
  return { success: true as const, count: userIds.length };
}

export async function getAdminAnalyticsDetail(): Promise<{
  analytics: AdminAnalyticsDetail | null;
  error?: string;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { analytics: null, error: auth.error ?? "Forbidden" };
  }

  const supabase = auth.supabase;

  const [
    { data: listings },
    { data: breeders },
    { count: favoritesCount },
    { count: inquiriesCount },
    { count: viewsCount },
  ] = await Promise.all([
    supabase.from("horse_listings").select("*").order("view_count", { ascending: false }).limit(100),
    supabase.from("breeders").select("id, name, verified").order("created_at", { ascending: false }).limit(100),
    supabase.from("favorites").select("id", { count: "exact", head: true }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }),
    supabase.from("listing_views").select("id", { count: "exact", head: true }),
  ]);

  const listingRows = (listings ?? []) as HorseListingRow[];
  const topViewedHorses = listingRows.slice(0, 10).map((row) => mapListingRow(row, "Price on request"));

  const breedCounts = new Map<string, number>();
  const disciplineCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const sellerMap = new Map<string, AdminSellerListItem>();

  for (const listing of listingRows) {
    breedCounts.set(listing.breed, (breedCounts.get(listing.breed) ?? 0) + 1);
    disciplineCounts.set(listing.discipline, (disciplineCounts.get(listing.discipline) ?? 0) + 1);
    countryCounts.set(listing.country, (countryCounts.get(listing.country) ?? 0) + 1);

    const existing = sellerMap.get(listing.user_id) ?? {
      userId: listing.user_id,
      sellerReference: formatOwnerReference(listing.user_id),
      sellerVerified: false,
      sellerVerificationStatus: "none" as const,
      sellerVerificationNotes: null,
      sellerVerificationDocuments: [],
      role: "user" as const,
      listingCount: 0,
      activeListingCount: 0,
      totalViews: 0,
      createdAt: listing.created_at,
    };
    existing.listingCount += 1;
    if (listing.status === "active") existing.activeListingCount += 1;
    existing.totalViews += listing.view_count ?? 0;
    sellerMap.set(listing.user_id, existing);
  }

  const topSellers = [...sellerMap.values()].sort((a, b) => b.totalViews - a.totalViews).slice(0, 10);
  const topBreeders = (breeders ?? [])
    .map((breeder) => ({
      id: breeder.id as string,
      name: breeder.name as string,
      verified: Boolean(breeder.verified),
      listingCount: 0,
    }))
    .slice(0, 10);

  const toPoints = (map: Map<string, number>) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));

  const views = viewsCount ?? 0;
  const favorites = favoritesCount ?? 0;
  const inquiries = inquiriesCount ?? 0;
  const conversionRate = views > 0 ? Math.round(((favorites + inquiries) / views) * 1000) / 10 : 0;

  return {
    analytics: {
      topViewedHorses,
      topBreeders,
      topSellers,
      countries: toPoints(countryCounts),
      topBreeds: toPoints(breedCounts),
      topDisciplines: toPoints(disciplineCounts),
      favoritesCount: favorites,
      inquiriesCount: inquiries,
      viewsCount: views,
      conversionRate,
    },
  };
}

export async function assignFeedbackReport(reportId: string, adminId: string | null) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { error } = await auth.supabase
    .from("feedback_reports")
    .update({ assigned_admin_id: adminId })
    .eq("id", reportId);

  if (error) return { error: error.message };
  revalidatePath("/admin/feedback");
  return { success: true as const };
}

export async function replyFeedbackReport(reportId: string, adminReply: string) {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Forbidden" };
  }

  const { error } = await auth.supabase
    .from("feedback_reports")
    .update({ admin_reply: adminReply.trim(), status: "resolved" })
    .eq("id", reportId);

  if (error) return { error: error.message };
  revalidatePath("/admin/feedback");
  return { success: true as const };
}
