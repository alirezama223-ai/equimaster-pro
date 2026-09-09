-- SHABDIZ: paid horse-listing billing foundation
-- Horse-sale listings are monetized separately from site advertisements.

create table if not exists public.horse_listing_pricing_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  visibility_level text not null,
  duration_days integer not null check (duration_days between 1 and 365),
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'EUR' check (currency in ('EUR','USD','GBP')),
  sort_order integer not null default 0,
  active boolean not null default true,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.horse_listing_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.horse_listings(id) on delete restrict,
  buyer_user_id uuid not null references auth.users(id) on delete restrict,
  pricing_plan_id uuid not null references public.horse_listing_pricing_plans(id) on delete restrict,
  plan_slug text not null,
  plan_name text not null,
  visibility_level text not null,
  duration_days integer not null check (duration_days between 1 and 365),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null check (currency in ('EUR','USD','GBP')),
  status text not null default 'pending_payment'
    check (status in ('pending_payment','paid','failed','refunded','cancelled','expired')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  payment_reference text,
  paid_at timestamptz,
  refunded_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz,
  agb_version text not null,
  marketplace_rules_version text not null,
  agb_accepted_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists horse_listing_orders_checkout_session_idx
  on public.horse_listing_orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists horse_listing_orders_listing_idx
  on public.horse_listing_orders (listing_id, created_at desc);

create index if not exists horse_listing_orders_user_idx
  on public.horse_listing_orders (buyer_user_id, created_at desc);

create index if not exists horse_listing_orders_status_idx
  on public.horse_listing_orders (status, created_at desc);

alter table public.horse_listings
  add column if not exists listing_package_slug text,
  add column if not exists listing_visibility text,
  add column if not exists listing_expires_at timestamptz;

create index if not exists horse_listings_listing_expires_at_idx
  on public.horse_listings (listing_expires_at)
  where listing_expires_at is not null;

insert into public.horse_listing_pricing_plans
  (slug, name, visibility_level, duration_days, price, currency, sort_order, active, features)
values
  ('basic', 'Basic', 'Standard Visibility', 30, 4.90, 'EUR', 1, true,
   '["Full horse information","Photos and video","Price and pedigree","Seller information","Search listing","Contact and messaging"]'::jsonb),
  ('premium', 'Premium', 'Enhanced Visibility', 60, 9.90, 'EUR', 2, true,
   '["Everything in Basic","Featured placement","Highlighted listing card","Longer visibility"]'::jsonb),
  ('professional', 'Professional', 'High Visibility', 90, 19.90, 'EUR', 3, true,
   '["Everything in Premium","Higher search priority","Professional listings section","Additional highlighting"]'::jsonb),
  ('elite', 'Elite', 'Priority Visibility', 90, 29.90, 'EUR', 4, true,
   '["Everything in Professional","Top placement","Premium marketplace position","Elite badge"]'::jsonb),
  ('showcase', 'Showcase', 'Maximum Visibility', 90, 49.90, 'EUR', 5, true,
   '["Everything in Elite","SHABDIZ Showcase","Gallery images and video","Highlighted horse introduction","Maximum marketplace visibility"]'::jsonb)
on conflict (slug) do update set
  name = excluded.name,
  visibility_level = excluded.visibility_level,
  duration_days = excluded.duration_days,
  price = excluded.price,
  currency = excluded.currency,
  sort_order = excluded.sort_order,
  active = excluded.active,
  features = excluded.features,
  updated_at = now();

alter table public.horse_listing_pricing_plans enable row level security;
alter table public.horse_listing_orders enable row level security;

revoke all on public.horse_listing_pricing_plans from anon, authenticated;
revoke all on public.horse_listing_orders from anon, authenticated;

drop policy if exists "public can read active horse listing pricing plans" on public.horse_listing_pricing_plans;
create policy "public can read active horse listing pricing plans"
  on public.horse_listing_pricing_plans
  for select
  to anon, authenticated
  using (active = true);

notify pgrst, 'reload schema';
