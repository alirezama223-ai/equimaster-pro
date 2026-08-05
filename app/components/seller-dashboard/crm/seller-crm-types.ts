export type PipelineStage =
  | "new-inquiry"
  | "contacted"
  | "visit-scheduled"
  | "negotiating"
  | "sold";

export type PipelinePriority = "high" | "medium" | "low";

export type PipelineDeal = {
  id: string;
  buyerName: string;
  buyerAvatar?: string;
  horseName: string;
  priceLabel: string;
  dateLabel: string;
  priority: PipelinePriority;
  stage: PipelineStage;
};

export type BuyerStatus = "new" | "hot" | "returning" | "vip";

export type CrmBuyer = {
  id: string;
  name: string;
  email: string;
  interestedHorse: string;
  lastContactLabel: string;
  status: BuyerStatus;
};

export type CrmVisit = {
  id: string;
  dateLabel: string;
  timeLabel: string;
  horseName: string;
  buyerName: string;
  location: string;
  isToday: boolean;
};

export type CrmNotificationType =
  | "inquiry"
  | "favorite"
  | "profile-view"
  | "visit-request"
  | "offer";

export type CrmNotification = {
  id: string;
  type: CrmNotificationType;
  title: string;
  description: string;
  timeLabel: string;
  unread: boolean;
};

export type CrmPerformanceSnapshot = {
  bestPerformingHorse: string;
  mostViewedHorse: string;
  mostViewedCount: number;
  highestSavedHorse: string;
  highestSavedCount: number;
  averageResponseLabel: string;
  conversionLabel: string;
};

export type CrmAiRecommendation = {
  id: string;
  label: string;
  impact: "high" | "medium";
};

export type SellerCrmData = {
  pipeline: PipelineDeal[];
  buyers: CrmBuyer[];
  visits: CrmVisit[];
  notifications: CrmNotification[];
  performance: CrmPerformanceSnapshot;
  aiRecommendations: CrmAiRecommendation[];
};

export const PIPELINE_COLUMNS: { key: PipelineStage; label: string }[] = [
  { key: "new-inquiry", label: "New Inquiry" },
  { key: "contacted", label: "Contacted" },
  { key: "visit-scheduled", label: "Visit Scheduled" },
  { key: "negotiating", label: "Negotiating" },
  { key: "sold", label: "Sold" },
];
