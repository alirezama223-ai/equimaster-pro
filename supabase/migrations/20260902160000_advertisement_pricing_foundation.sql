-- Pricing and billing foundation for advertising campaigns.
-- No seed/demo pricing is inserted; commercial prices must be configured by the operator.

create table if not exists public.advertisement_pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  placement text not null check (placement in ('homepage_top', 'homepage_featured', 'homepage_bottom')),
  duration_days integer not null check (duration_days between 1 and 365),
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'EUR' check (currency in ('EUR', 'USD', 'GBP')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists advertisement_pricing_plans_lookup_idx
  on public.advertisement_pricing_plans (placement, active, duration_days);

alter table public.advertisements
  add column if not exists pricing_plan_id uuid references public.advertisement_pricing_plans(id) on delete set null,
  add column if not exists quoted_amount numeric(12,2) check (quoted_amount is null or quoted_amount >= 0),
  add column if not exists billing_currency text check (billing_currency is null or billing_currency in ('EUR', 'USD', 'GBP')),
  add column if not exists billing_status text not null default 'not_required'
    check (billing_status in ('not_required', 'quote', 'pending_payment', 'paid', 'failed', 'refunded', 'cancelled')),
  add column if not exists payment_reference text;

create index if not exists advertisements_pricing_plan_idx
  on public.advertisements (pricing_plan_id);
create index if not exists advertisements_billing_status_idx
  on public.advertisements (billing_status, created_at desc);

create or replace function public.set_advertisement_pricing_plans_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists advertisement_pricing_plans_set_updated_at on public.advertisement_pricing_plans;
create trigger advertisement_pricing_plans_set_updated_at
before update on public.advertisement_pricing_plans
for each row execute function public.set_advertisement_pricing_plans_updated_at();

alter table public.advertisement_pricing_plans enable row level security;
drop policy if exists "Admins can manage advertisement pricing plans" on public.advertisement_pricing_plans;
create policy "Admins can manage advertisement pricing plans"
on public.advertisement_pricing_plans
for all
using (public.is_admin())
with check (public.is_admin());
