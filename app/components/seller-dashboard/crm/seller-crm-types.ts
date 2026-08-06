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
  dateAt?: string;
  dateKey?: string;
  demoIndex?: number;
  priority: PipelinePriority;
  stage: PipelineStage;
};

export type BuyerStatus = "new" | "hot" | "returning" | "vip";

export type CrmBuyer = {
  id: string;
  name: string;
  email: string;
  interestedHorse: string;
  lastContactAt?: string;
  lastContactKey?: string;
  demoIndex?: number;
  status: BuyerStatus;
};

export type CrmVisit = {
  id: string;
  dateAt: string;
  timeLabel: string;
  horseName: string;
  demoHorseIndex?: number;
  buyerName: string;
  demoBuyerIndex?: number;
  locationKey: string;
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
  titleKey: string;
  descriptionKey: string;
  descriptionValues?: Record<string, string | number>;
  timeAt?: string;
  timeKey?: string;
  timeValues?: Record<string, string | number>;
  unread: boolean;
};

export type CrmPerformanceSnapshot = {
  bestPerformingHorse: string;
  bestPerformingFallbackKey?: string;
  mostViewedHorse: string;
  mostViewedFallbackKey?: string;
  mostViewedCount: number;
  highestSavedHorse: string;
  highestSavedFallbackKey?: string;
  highestSavedCount: number;
  averageResponseKey: string;
  conversionKey: string;
  conversionValues?: Record<string, string | number>;
};

export type CrmAiRecommendation = {
  id: string;
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
