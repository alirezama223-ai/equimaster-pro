export type PlanSlug = "free" | "pro" | "enterprise";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "paused";

export type BillingInterval = "month" | "year";

export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

export type PlanRow = {
  id: string;
  slug: PlanSlug;
  name: string;
  description: string | null;
  max_active_listings: number | null;
  featured_listings: boolean;
  verification_priority: boolean;
  analytics_enabled: boolean;
  crm_enabled: boolean;
  unlimited_messaging: boolean;
  premium_support: boolean;
  unlimited_staff: boolean;
  multiple_seller_accounts: boolean;
  api_access: boolean;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  monthly_price_cents: number;
  yearly_price_cents: number;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_interval: BillingInterval | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionEventRow = {
  id: string;
  subscription_id: string | null;
  user_id: string | null;
  event_type: string;
  stripe_event_id: string | null;
  previous_plan_slug: string | null;
  new_plan_slug: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type BillingHistoryRow = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  stripe_invoice_id: string | null;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
};

export type PlanFeatures = {
  maxActiveListings: number | null;
  featuredListings: boolean;
  verificationPriority: boolean;
  analyticsEnabled: boolean;
  crmEnabled: boolean;
  unlimitedMessaging: boolean;
  premiumSupport: boolean;
  unlimitedStaff: boolean;
  multipleSellerAccounts: boolean;
  apiAccess: boolean;
};

export type SubscriptionUsageSnapshot = {
  activeListings: number;
  listingLimit: number | null;
  remainingListings: number | null;
  atLimit: boolean;
};

export type SubscriptionSnapshot = {
  plan: PlanRow;
  subscription: SubscriptionRow;
  features: PlanFeatures;
  usage: SubscriptionUsageSnapshot;
  isPaid: boolean;
  canUpgrade: boolean;
  canManageBilling: boolean;
};

export type ListingQuotaError = {
  error: string;
  errorCode: "LISTING_QUOTA_EXCEEDED";
  quota: SubscriptionUsageSnapshot;
};

export type AdminSubscriptionStats = {
  totalSubscriptions: number;
  activePaidSubscriptions: number;
  freeUsers: number;
  proUsers: number;
  enterpriseUsers: number;
  monthlyRecurringRevenueCents: number;
  totalRevenueCents: number;
  paidInvoices: number;
};

export type AdminSubscriptionListItem = {
  userId: string;
  userReference: string;
  planSlug: PlanSlug;
  planName: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval | null;
  activeListings: number;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
};

export const LISTING_QUOTA_ERROR_CODE = "LISTING_QUOTA_EXCEEDED" as const;
