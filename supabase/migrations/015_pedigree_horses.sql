-- EquiMaster Pro Phase 8: pedigree_horses + listing/stallion linkage
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–014).

create table if not exists public.pedigree_horses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  sex text not null default 'unknown' check (
    sex in ('stallion', 'mare', 'gelding', 'unknown')
  ),
  birth_year integer check (birth_year is null or birth_year >= 1970),
  breed text,
  studbook text,
  registration_number text,
  color text,
  country text,
  sire_id uuid references public.pedigree_horses (id) on delete set null,
  dam_id uuid references public.pedigree_horses (id) on delete set null,
  external_reference text,
  description text,
  verified boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pedigree_horses_not_own_sire check (sire_id is null or sire_id <> id),
  constraint pedigree_horses_not_own_dam check (dam_id is null or dam_id <> id)
);

create index if not exists pedigree_horses_name_idx on public.pedigree_horses (name);
create index if not exists pedigree_horses_normalized_name_idx on public.pedigree_horses (normalized_name);
create index if not exists pedigree_horses_sire_id_idx on public.pedigree_horses (sire_id);
create index if not exists pedigree_horses_dam_id_idx on public.pedigree_horses (dam_id);
create index if not exists pedigree_horses_registration_number_idx
  on public.pedigree_horses (registration_number)
  where registration_number is not null;
create index if not exists pedigree_horses_birth_year_idx on public.pedigree_horses (birth_year);
create index if not exists pedigree_horses_verified_idx on public.pedigree_horses (verified);

alter table public.horse_listings
  add column if not exists pedigree_horse_id uuid references public.pedigree_horses (id) on delete set null;

alter table public.stallions
  add column if not exists pedigree_horse_id uuid references public.pedigree_horses (id) on delete set null;

create index if not exists horse_listings_pedigree_horse_id_idx
  on public.horse_listings (pedigree_horse_id)
  where pedigree_horse_id is not null;

create index if not exists stallions_pedigree_horse_id_idx
  on public.stallions (pedigree_horse_id)
  where pedigree_horse_id is not null;

create or replace function public.set_pedigree_horses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pedigree_horses_updated_at on public.pedigree_horses;
create trigger pedigree_horses_updated_at
before update on public.pedigree_horses
for each row
execute function public.set_pedigree_horses_updated_at();

create or replace function public.protect_pedigree_horse_verified()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified := false;
  elsif tg_op = 'UPDATE' then
    new.verified := old.verified;
  end if;

  return new;
end;
$$;

drop trigger if exists pedigree_horses_protect_verified on public.pedigree_horses;
create trigger pedigree_horses_protect_verified
before insert or update on public.pedigree_horses
for each row
execute function public.protect_pedigree_horse_verified();

alter table public.pedigree_horses enable row level security;

drop policy if exists "Public can read pedigree horses" on public.pedigree_horses;
create policy "Public can read pedigree horses"
on public.pedigree_horses
for select
using (true);

drop policy if exists "Authenticated can create pedigree horses" on public.pedigree_horses;
create policy "Authenticated can create pedigree horses"
on public.pedigree_horses
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Creators can update unverified pedigree horses" on public.pedigree_horses;
create policy "Creators can update unverified pedigree horses"
on public.pedigree_horses
for update
to authenticated
using (created_by = auth.uid() and verified = false)
with check (created_by = auth.uid() and verified = false);

drop policy if exists "Admins can read all pedigree horses" on public.pedigree_horses;
create policy "Admins can read all pedigree horses"
on public.pedigree_horses
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update pedigree horses" on public.pedigree_horses;
create policy "Admins can update pedigree horses"
on public.pedigree_horses
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.pedigree_horses to anon, authenticated;
grant insert, update on public.pedigree_horses to authenticated;
