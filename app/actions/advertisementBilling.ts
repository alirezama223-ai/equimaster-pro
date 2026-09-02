"use server";

import { requireAdmin } from "@/app/lib/admin";

export type AdvertisementBillingOrder = {
  id: string;
  advertisement_id: string;
  buyer_user_id: string;
  plan_name: string;
  placement: string;
  duration_days: number;
  amount: number;
  currency: string;
  status: string;
  payment_provider: string | null;
  payment_reference: string | null;
  invoice_number: string | null;
  created_at: string;
  paid_at: string | null;
};

export async function getAdminAdvertisementBillingOrders() {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { orders: [] as AdvertisementBillingOrder[], error: auth.error ?? "Forbidden" };
  }

  const { data, error } = await auth.supabase
    .from("advertisement_billing_orders")
    .select("id,advertisement_id,buyer_user_id,plan_name,placement,duration_days,amount,currency,status,payment_provider,payment_reference,invoice_number,created_at,paid_at")
    .order("created_at", { ascending: false });

  if (error) return { orders: [] as AdvertisementBillingOrder[], error: error.message };
  return { orders: (data ?? []) as AdvertisementBillingOrder[], error: undefined };
}
