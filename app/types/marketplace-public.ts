import type { Horse } from "@/app/data/horses";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { PedigreeHorse } from "@/app/types/pedigree";

export type PublicTrainingSummarySnapshot = {
  totalSessions: number;
  completedSessions: number;
  completionRateLabel: string;
  averageRating: number | null;
  currentTrainingStreak: number;
  lastSessionDateLabel: string | null;
};

export type PublicHealthSummarySnapshot = {
  latestCheckDate: string | null;
  activeInjuryCount: number;
  overdueVaccinationCount: number;
  readinessScore: number | null;
  readinessLabel: string;
};

export type PublicListingProfile = {
  listing: HorseListingRow;
  horse: Horse;
  pedigreeHorse: PedigreeHorse | null;
  trainingSummary: PublicTrainingSummarySnapshot | null;
  healthSummary: PublicHealthSummarySnapshot | null;
  publicUrl: string;
};

export type SellerDashboardListingMetrics = {
  listingId: string;
  viewCount: number;
  favoriteCount: number;
  inquiryCount: number;
};

export type SellerDashboardData = {
  stats: {
    total: number;
    active: number;
    draft: number;
    sold: number;
    archived: number;
    totalViews: number;
    totalFavorites: number;
    totalInquiries: number;
  };
  listings: HorseListingRow[];
  metricsByListingId: Record<string, SellerDashboardListingMetrics>;
  recentInquiries: import("@/app/types/inquiry").SellerInquiry[];
};
