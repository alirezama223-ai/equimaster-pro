import type { AdminDashboardStats } from "@/app/actions/admin";
import type { SellerVerificationStatus } from "@/app/types/profile";

export type { SellerVerificationStatus };

export type AccountStatus = "active" | "suspended" | "banned";

export type AdminEnterpriseStats = AdminDashboardStats & {
  totalUsers: number;
  newUsers30d: number;
  adminUsers: number;
  totalListings: number;
  publishedListings: number;
  pendingListings: number;
  rejectedListings: number;
  verifiedSellers: number;
  pendingSellers: number;
  totalFavorites: number;
  totalMessages: number;
  totalNotifications: number;
  openFeedbackReports: number;
  totalConversations: number;
  totalListingViews: number;
  archivedListings: number;
  soldListings: number;
};

export type AdminChartPoint = { label: string; value: number };

export type AdminDashboardCharts = {
  listingsPerMonth: AdminChartPoint[];
  newUsersPerMonth: AdminChartPoint[];
  messagesPerMonth: AdminChartPoint[];
  viewsPerMonth: AdminChartPoint[];
  listingsByCountry: AdminChartPoint[];
};

export type AdminAnalyticsStats = AdminEnterpriseStats;

export type AdminUserListItem = {
  userId: string;
  role: "user" | "admin";
  accountStatus: AccountStatus;
  country: string | null;
  sellerVerified: boolean;
  sellerVerificationStatus: SellerVerificationStatus;
  createdAt: string;
  updatedAt: string;
  listingCount: number;
  activeListingCount: number;
};

export type AdminListingListItem = {
  id: string;
  name: string;
  slug: string;
  sellerId: string;
  sellerName: string;
  sellerReference: string;
  breed: string;
  country: string;
  status: string;
  verified: boolean;
  featured: boolean;
  hidden: boolean;
  rejectionReason: string | null;
  viewCount: number;
  priceLabel: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type AdminSellerListItem = {
  userId: string;
  sellerReference: string;
  sellerVerified: boolean;
  sellerVerificationStatus: SellerVerificationStatus;
  sellerVerificationNotes: string | null;
  sellerVerificationDocuments: Array<{ name: string; url: string; uploadedAt?: string }>;
  role: "user" | "admin";
  listingCount: number;
  activeListingCount: number;
  totalViews: number;
  createdAt: string;
};

export type AdminMessageListItem = {
  id: string;
  conversationId: string;
  senderReference: string;
  body: string;
  listingName: string;
  createdAt: string;
  readAt: string | null;
};

export type AdminConversationListItem = {
  id: string;
  buyerReference: string;
  sellerReference: string;
  listingName: string;
  listingSlug: string;
  messageCount: number;
  updatedAt: string;
};

export type AdminReportSummary = {
  generatedAt: string;
  totals: {
    users: number;
    listings: number;
    activeListings: number;
    conversations: number;
    feedbackOpen: number;
    listingViews: number;
  };
  listingsByStatus: Record<string, number>;
  feedbackByStatus: Record<string, number>;
  recentListings: AdminListingListItem[];
  topViewedListings: AdminListingListItem[];
};

export type AdminAnalyticsDetail = {
  topViewedHorses: AdminListingListItem[];
  topBreeders: Array<{ id: string; name: string; verified: boolean; listingCount: number }>;
  topSellers: AdminSellerListItem[];
  countries: AdminChartPoint[];
  topBreeds: AdminChartPoint[];
  topDisciplines: AdminChartPoint[];
  favoritesCount: number;
  inquiriesCount: number;
  viewsCount: number;
  conversionRate: number;
};

export type AdminMarketplaceSettings = {
  maintenance_mode: boolean;
  require_listing_review: boolean;
  support_email: string;
  welcome_message: string;
  homepage_hero: {
    title: string;
    subtitle: string;
    cta_label: string;
    cta_href: string;
  };
  featured_breeds: string[];
  featured_stallions: string[];
  feature_flags: {
    enable_messaging: boolean;
    enable_favorites: boolean;
    enable_seller_verification: boolean;
    enable_listing_moderation: boolean;
  };
};

export type BroadcastTarget = "all" | "breeders" | "sellers" | "buyers" | "admins";

export const ADMIN_USERS_PAGE_SIZE = 20;
export const ADMIN_LISTINGS_PAGE_SIZE = 20;
export const ADMIN_MESSAGES_PAGE_SIZE = 30;

export type AdminListingFilter =
  | "all"
  | "active"
  | "draft"
  | "sold"
  | "archived"
  | "pending"
  | "rejected"
  | "featured"
  | "hidden";

export type AdminUserFilter =
  | "all"
  | "admin"
  | "seller"
  | "verified_seller"
  | "suspended"
  | "banned"
  | "pending_verification";

export type AdminUserSort = "newest" | "oldest" | "most_listings";
export type AdminListingSort = "newest" | "oldest" | "most_views" | "updated";

export type AdminExtendedFeedbackReport = {
  id: string;
  userId: string;
  userEmail: string | null;
  category: string;
  severity: string;
  description: string;
  pagePath: string;
  browser: string;
  os: string;
  locale: string;
  screenshotUrl: string | null;
  status: string;
  adminNotes: string | null;
  adminReply: string | null;
  assignedAdminId: string | null;
  assignedAdminReference: string | null;
  createdAt: string;
  updatedAt: string;
};
