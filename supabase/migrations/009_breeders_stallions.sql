-- EquiMaster Pro: breeders and stallions directories
-- Run this manually in Supabase Dashboard → SQL Editor

create table if not exists public.breeders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text,
  description text not null default '',
  country text not null,
  city text,
  website text,
  email text,
  phone text,
  logo_url text,
  cover_image_url text,
  disciplines jsonb not null default '[]'::jsonb,
  verified boolean not null default false,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stallions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  breeder_id uuid not null references public.breeders (id) on delete cascade,
  name text not null,
  breed text not null,
  studbook text,
  birth_year integer check (birth_year is null or birth_year >= 1970),
  color text not null,
  height integer check (height is null or height > 0),
  country text not null,
  discipline text not null,
  competition_level text not null,
  sire text not null,
  dam text not null,
  dam_sire text not null,
  stud_fee numeric check (stud_fee is null or stud_fee >= 0),
  stud_fee_currency text not null default 'EUR',
  availability text not null default 'available' check (
    availability in ('available', 'limited', 'booked', 'retired')
  ),
  breeding_methods jsonb not null default '[]'::jsonb,
  description text not null default '',
  performance text not null default '',
  breeding_highlights text not null default '',
  image_urls jsonb not null default '[]'::jsonb,
  cover_image_url text,
  verified boolean not null default false,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists breeders_owner_id_active_idx
  on public.breeders (owner_id)
  where status = 'active';

create index if not exists breeders_status_idx on public.breeders (status);
create index if not exists breeders_country_idx on public.breeders (country);
create index if not exists breeders_created_at_idx on public.breeders (created_at desc);

create index if not exists stallions_owner_id_idx on public.stallions (owner_id);
create index if not exists stallions_breeder_id_idx on public.stallions (breeder_id);
create index if not exists stallions_status_idx on public.stallions (status);
create index if not exists stallions_discipline_idx on public.stallions (discipline);
create index if not exists stallions_country_idx on public.stallions (country);
create index if not exists stallions_birth_year_idx on public.stallions (birth_year);
create index if not exists stallions_stud_fee_idx on public.stallions (stud_fee);
create index if not exists stallions_created_at_idx on public.stallions (created_at desc);

create or replace function public.set_breeders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_stallions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists breeders_updated_at on public.breeders;
create trigger breeders_updated_at
before update on public.breeders
for each row
execute function public.set_breeders_updated_at();

drop trigger if exists stallions_updated_at on public.stallions;
create trigger stallions_updated_at
before update on public.stallions
for each row
execute function public.set_stallions_updated_at();

alter table public.breeders enable row level security;
alter table public.stallions enable row level security;

drop policy if exists "Public can read active breeders" on public.breeders;
create policy "Public can read active breeders"
on public.breeders
for select
using (status = 'active');

drop policy if exists "Owners can read own breeders" on public.breeders;
create policy "Owners can read own breeders"
on public.breeders
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Owners can create own breeders" on public.breeders;
create policy "Owners can create own breeders"
on public.breeders
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Owners can update own breeders" on public.breeders;
create policy "Owners can update own breeders"
on public.breeders
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Owners can delete own breeders" on public.breeders;
create policy "Owners can delete own breeders"
on public.breeders
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Public can read active stallions" on public.stallions;
create policy "Public can read active stallions"
on public.stallions
for select
using (status = 'active');

drop policy if exists "Owners can read own stallions" on public.stallions;
create policy "Owners can read own stallions"
on public.stallions
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Owners can create own stallions" on public.stallions;
create policy "Owners can create own stallions"
on public.stallions
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.breeders b
    where b.id = breeder_id
      and b.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can update own stallions" on public.stallions;
create policy "Owners can update own stallions"
on public.stallions
for update
to authenticated
using (owner_id = auth.uid())
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.breeders b
    where b.id = breeder_id
      and b.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can delete own stallions" on public.stallions;
create policy "Owners can delete own stallions"
on public.stallions
for delete
to authenticated
using (owner_id = auth.uid());

grant select on public.breeders to anon, authenticated;
grant insert, update, delete on public.breeders to authenticated;

grant select on public.stallions to anon, authenticated;
grant insert, update, delete on public.stallions to authenticated;
