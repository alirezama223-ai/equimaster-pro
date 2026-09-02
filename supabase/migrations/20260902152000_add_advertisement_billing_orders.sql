create table if not exists public.advertisement_billing_orders (
  id uuid primary key default gen_random_uuid(),
  advertisement_id uuid not null references public.advertisements(id) on delete restrict,
  buyer_user_id uuid not null references auth.users(id) on delete restrict,
  pricing_plan_id uuid references public.advertisement_pricing_plans(id) on delete restrict,
  plan_name text not null,
  placement text not null check (placement in ('homepage_top','homepage_featured','homepage_bottom')),
  duration_days integer not null check (duration_days between 1 and 365),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null check (currency in ('EUR','USD','GBP')),
  status text not null default 'pending_payment' check (status in ('draft','pending_payment','paid','failed','refunded','cancelled','expired')),
  payment_provider text check (payment_provider is null or payment_provider in ('stripe','manual','other')),
  payment_session_id text,
  payment_intent_id text,
  payment_reference text,
  invoice_number text,
  invoice_id text,
  invoice_pdf_url text,
  hosted_invoice_url text,
  paid_at timestamptz,
  refunded_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists advertisement_billing_orders_buyer_idx on public.advertisement_billing_orders(buyer_user_id, created_at desc);
create index if not exists advertisement_billing_orders_ad_idx on public.advertisement_billing_orders(advertisement_id, created_at desc);
create index if not exists advertisement_billing_orders_status_idx on public.advertisement_billing_orders(status, created_at desc);

create table if not exists public.advertisement_billing_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.advertisement_billing_orders(id) on delete set null,
  event_type text not null,
  provider text,
  provider_event_id text unique,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists advertisement_billing_events_order_idx on public.advertisement_billing_events(order_id, created_at desc);

alter table public.advertisement_billing_orders enable row level security;
alter table public.advertisement_billing_events enable row level security;

grant select, insert, update on public.advertisement_billing_orders to authenticated;
grant select on public.advertisement_billing_events to authenticated;

drop policy if exists "Users can read their advertisement billing orders" on public.advertisement_billing_orders;
create policy "Users can read their advertisement billing orders"
  on public.advertisement_billing_orders for select to authenticated
  using (buyer_user_id = auth.uid() or is_admin());

drop policy if exists "Users can create their advertisement billing orders" on public.advertisement_billing_orders;
create policy "Users can create their advertisement billing orders"
  on public.advertisement_billing_orders for insert to authenticated
  with check (buyer_user_id = auth.uid() and exists (
    select 1 from public.advertisements a
    where a.id = advertisement_id and a.created_by = auth.uid()
  ));

drop policy if exists "Admins can manage advertisement billing orders" on public.advertisement_billing_orders;
create policy "Admins can manage advertisement billing orders"
  on public.advertisement_billing_orders for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "Admins can read advertisement billing events" on public.advertisement_billing_events;
create policy "Admins can read advertisement billing events"
  on public.advertisement_billing_events for select to authenticated
  using (is_admin());

grant all on public.advertisement_billing_orders to service_role;
grant all on public.advertisement_billing_events to service_role;

create or replace function public.set_advertisement_billing_order_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_advertisement_billing_order_updated_at on public.advertisement_billing_orders;
create trigger set_advertisement_billing_order_updated_at
before update on public.advertisement_billing_orders
for each row execute function public.set_advertisement_billing_order_updated_at();