import type { AdminDashboardStats } from "@/app/actions/admin";

export type AdminAnalyticsStats = AdminDashboardStats & {
  totalUsers: number;
  adminUsers: number;
  verifiedSellers: number;
  pendingSellers: number;
  totalListings: number;
  draftListings: number;
  archivedListings: number;
  soldListings: number;
  openFeedbackReports: number;
  totalConversations: number;
  totalListingViews: number;
  listingsPublishedLast30Days: number;
};

export type AdminUserListItem = {
  userId: string;
  role: "user" | "admin";
  sellerVerified: boolean;
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
  role: "user" | "admin";
  listingCount: number;
  activeListingCount: number;
  totalViews: number;
  createdAt: string;
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

export type AdminMarketplaceSettings = {
  maintenance_mode: boolean;
  require_listing_review: boolean;
  support_email: string;
  welcome_message: string;
};

export const ADMIN_USERS_PAGE_SIZE = 20;
export const ADMIN_LISTINGS_PAGE_SIZE = 20;

export type AdminListingFilter = "all" | "active" | "draft" | "sold" | "archived";
export type AdminUserFilter = "all" | "admin" | "seller" | "verified_seller";
