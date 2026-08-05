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

export const PIPELINE_STAGES = [
  "new-inquiry",
  "contacted",
  "visit-scheduled",
  "negotiating",
  "sold",
] as const satisfies readonly PipelineStage[];

export const PIPELINE_COLUMNS: { key: PipelineStage; labelKey: string }[] = [
  { key: "new-inquiry", labelKey: "crm.pipeline.columns.new-inquiry" },
  { key: "contacted", labelKey: "crm.pipeline.columns.contacted" },
  { key: "visit-scheduled", labelKey: "crm.pipeline.columns.visit-scheduled" },
  { key: "negotiating", labelKey: "crm.pipeline.columns.negotiating" },
  { key: "sold", labelKey: "crm.pipeline.columns.sold" },
];
