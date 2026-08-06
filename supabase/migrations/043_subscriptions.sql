-- EquiMaster Pro: subscription plans, billing, and Stripe integration

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('free', 'pro', 'enterprise')),
  name text not null,
  description text,
  max_active_listings integer,
  featured_listings boolean not null default false,
  verification_priority boolean not null default false,
  analytics_enabled boolean not null default false,
  crm_enabled boolean not null default false,
  unlimited_messaging boolean not null default false,
  premium_support boolean not null default false,
  unlimited_staff boolean not null default false,
  multiple_seller_accounts boolean not null default false,
  api_access boolean not null default false,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  monthly_price_cents integer not null default 0,
  yearly_price_cents integer not null default 0,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plans (
  slug,
  name,
  description,
  max_active_listings,
  featured_listings,
  verification_priority,
  analytics_enabled,
  crm_enabled,
  unlimited_messaging,
  premium_support,
  unlimited_staff,
  multiple_seller_accounts,
  api_access,
  monthly_price_cents,
  yearly_price_cents,
  sort_order
)
values
  (
    'free',
    'Free',
    'Get started with essential marketplace tools.',
    3,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    0,
    0,
    1
  ),
  (
    'pro',
    'Pro',
    'Scale your sales with featured listings, analytics, and CRM.',
    25,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    false,
    false,
    4900,
    49000,
    2
  ),
  (
    'enterprise',
    'Enterprise',
    'Unlimited listings, staff, and enterprise support.',
    null,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    14900,
    149000,
    3
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  max_active_listings = excluded.max_active_listings,
  featured_listings = excluded.featured_listings,
  verification_priority = excluded.verification_priority,
  analytics_enabled = excluded.analytics_enabled,
  crm_enabled = excluded.crm_enabled,
  unlimited_messaging = excluded.unlimited_messaging,
  premium_support = excluded.premium_support,
  unlimited_staff = excluded.unlimited_staff,
  multiple_seller_accounts = excluded.multiple_seller_accounts,
  api_access = excluded.api_access,
  monthly_price_cents = excluded.monthly_price_cents,
  yearly_price_cents = excluded.yearly_price_cents,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'paused')),
  billing_interval text check (billing_interval in ('month', 'year')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_plan_id_idx on public.subscriptions (plan_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

-- ---------------------------------------------------------------------------
-- Subscription events (audit)
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  stripe_event_id text unique,
  previous_plan_slug text,
  new_plan_slug text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists subscription_events_user_id_idx
  on public.subscription_events (user_id, created_at desc);

create index if not exists subscription_events_subscription_id_idx
  on public.subscription_events (subscription_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Billing history
-- ---------------------------------------------------------------------------
create table if not exists public.billing_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  stripe_invoice_id text unique,
  amount_cents integer not null default 0,
  currency text not null default 'eur',
  status text not null check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_pdf_url text,
  hosted_invoice_url text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists billing_history_user_id_idx
  on public.billing_history (user_id, created_at desc);

create index if not exists billing_history_status_idx
  on public.billing_history (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.ensure_user_subscription(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription_id uuid;
  v_free_plan_id uuid;
begin
  select id into v_free_plan_id from public.plans where slug = 'free' limit 1;

  if v_free_plan_id is null then
    raise exception 'Free plan is not configured';
  end if;

  insert into public.subscriptions (user_id, plan_id, status)
  values (p_user_id, v_free_plan_id, 'active')
  on conflict (user_id) do nothing
  returning id into v_subscription_id;

  if v_subscription_id is null then
    select id into v_subscription_id from public.subscriptions where user_id = p_user_id;
  end if;

  return v_subscription_id;
end;
$$;

create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_user_subscription(new.user_id);
  return new;
end;
$$;

drop trigger if exists on_profile_created_subscription on public.profiles;
create trigger on_profile_created_subscription
after insert on public.profiles
for each row
execute function public.handle_new_user_subscription();

insert into public.subscriptions (user_id, plan_id, status)
select p.user_id, pl.id, 'active'
from public.profiles p
cross join public.plans pl
where pl.slug = 'free'
on conflict (user_id) do nothing;

create or replace function public.set_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_subscriptions_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;
alter table public.billing_history enable row level security;

drop policy if exists "Anyone can read active plans" on public.plans;
create policy "Anyone can read active plans"
on public.plans
for select
to authenticated
using (active = true or public.is_admin());

drop policy if exists "Admins manage plans" on public.plans;
create policy "Admins manage plans"
on public.plans
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users read own subscription" on public.subscriptions;
create policy "Users read own subscription"
on public.subscriptions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users update own subscription metadata" on public.subscriptions;
create policy "Users update own subscription metadata"
on public.subscriptions
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users insert own subscription" on public.subscriptions;
create policy "Users insert own subscription"
on public.subscriptions
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users read own subscription events" on public.subscription_events;
create policy "Users read own subscription events"
on public.subscription_events
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users read own billing history" on public.billing_history;
create policy "Users read own billing history"
on public.billing_history
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins read all billing history" on public.billing_history;
create policy "Admins read all billing history"
on public.billing_history
for select
to authenticated
using (public.is_admin());

grant select on public.plans to authenticated;
grant select, insert, update on public.subscriptions to authenticated;
grant select on public.subscription_events to authenticated;
grant select on public.billing_history to authenticated;

revoke all on function public.ensure_user_subscription(uuid) from public;
grant execute on function public.ensure_user_subscription(uuid) to authenticated;
