-- EquiMaster Pro Sprint 031: Demo infrastructure
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–027).
--
-- Demo organization metadata, per-user demo state, and RLS.
-- Seed data is inserted at runtime via app/lib/demo (Reset Demo action).

-- ---------------------------------------------------------------------------
-- demo_organizations — singleton demonstration stable
-- ---------------------------------------------------------------------------
create table if not exists public.demo_organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  created_at timestamptz not null default now(),
  constraint demo_organizations_name_not_blank check (length(trim(name)) > 0)
);

-- ---------------------------------------------------------------------------
-- demo_organization_members — trainer, owner, vet, farrier personas
-- ---------------------------------------------------------------------------
create table if not exists public.demo_organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.demo_organizations (id) on delete cascade,
  role text not null check (role in ('owner', 'trainer', 'vet', 'farrier')),
  display_name text not null,
  title text not null,
  contact_email text,
  created_at timestamptz not null default now(),
  constraint demo_organization_members_unique_role unique (organization_id, role)
);

create index if not exists demo_organization_members_org_idx
  on public.demo_organization_members (organization_id);

-- ---------------------------------------------------------------------------
-- demo_user_state — per-user demo mode and seeded entity tracking
-- ---------------------------------------------------------------------------
create table if not exists public.demo_user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  demo_mode_enabled boolean not null default false,
  demo_seeded boolean not null default false,
  demo_horse_ids uuid[] not null default '{}',
  demo_listing_ids uuid[] not null default '{}',
  demo_plan_ids uuid[] not null default '{}',
  primary_demo_horse_id uuid,
  last_reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists demo_user_state_demo_mode_idx
  on public.demo_user_state (demo_mode_enabled)
  where demo_mode_enabled = true;

create or replace function public.set_demo_user_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists demo_user_state_updated_at on public.demo_user_state;
create trigger demo_user_state_updated_at
before update on public.demo_user_state
for each row
execute function public.set_demo_user_state_updated_at();

-- ---------------------------------------------------------------------------
-- Seed demo organization (static metadata — no horse/training data)
-- ---------------------------------------------------------------------------
insert into public.demo_organizations (id, slug, name, description)
values (
  'a0000000-0000-4000-8000-000000000001',
  'equimaster-demo-stable',
  'EquiMaster Demo Stable',
  'A fully populated demonstration environment showcasing daily training, health tracking, analytics, and the rule engine across five sport horses.'
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description;

insert into public.demo_organization_members (organization_id, role, display_name, title, contact_email)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    'owner',
    'Sarah Mitchell',
    'Stable Owner',
    'sarah.mitchell@demo.equimaster.pro'
  ),
  (
    'a0000000-0000-4000-8000-000000000001',
    'trainer',
    'James Carter',
    'Head Trainer',
    'james.carter@demo.equimaster.pro'
  ),
  (
    'a0000000-0000-4000-8000-000000000001',
    'vet',
    'Dr. Elena Voss',
    'Equine Veterinarian',
    'elena.voss@demo.equimaster.pro'
  ),
  (
    'a0000000-0000-4000-8000-000000000001',
    'farrier',
    'Marcus Webb',
    'Master Farrier',
    'marcus.webb@demo.equimaster.pro'
  )
on conflict (organization_id, role) do update set
  display_name = excluded.display_name,
  title = excluded.title,
  contact_email = excluded.contact_email;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.demo_organizations enable row level security;
alter table public.demo_organization_members enable row level security;
alter table public.demo_user_state enable row level security;

drop policy if exists "Authenticated users can read demo organizations" on public.demo_organizations;
create policy "Authenticated users can read demo organizations"
on public.demo_organizations for select to authenticated
using (true);

drop policy if exists "Authenticated users can read demo organization members" on public.demo_organization_members;
create policy "Authenticated users can read demo organization members"
on public.demo_organization_members for select to authenticated
using (true);

drop policy if exists "Users can read own demo state" on public.demo_user_state;
create policy "Users can read own demo state"
on public.demo_user_state for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own demo state" on public.demo_user_state;
create policy "Users can insert own demo state"
on public.demo_user_state for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own demo state" on public.demo_user_state;
create policy "Users can update own demo state"
on public.demo_user_state for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Admins can manage demo user state" on public.demo_user_state;
create policy "Admins can manage demo user state"
on public.demo_user_state for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on public.demo_organizations from anon;
revoke all on public.demo_organization_members from anon;
revoke all on public.demo_user_state from anon;

grant select on public.demo_organizations to authenticated;
grant select on public.demo_organization_members to authenticated;
grant select, insert, update on public.demo_user_state to authenticated;
