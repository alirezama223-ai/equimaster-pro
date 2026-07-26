-- EquiMaster Pro: horse_listings table
-- Run this manually in Supabase Dashboard → SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.horse_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  breed text not null,
  gender text not null check (gender in ('Mare', 'Stallion', 'Gelding')),
  age integer not null check (age >= 0),
  height integer not null check (height > 0),
  color text not null,
  country text not null,
  discipline text not null,
  level text not null,
  price numeric,
  price_on_request boolean not null default false,
  sire text not null,
  dam text not null,
  dam_sire text not null,
  description text not null,
  image_urls jsonb not null default '[]'::jsonb,
  cover_image_url text,
  images_meta jsonb not null default '[]'::jsonb,
  video_url text,
  video_file_name text,
  seller_name text not null,
  seller_email text not null,
  seller_phone text not null,
  stable_name text,
  verified boolean not null default false,
  status text not null default 'active' check (status in ('active', 'draft', 'sold', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists horse_listings_user_id_idx on public.horse_listings (user_id);
create index if not exists horse_listings_status_idx on public.horse_listings (status);
create index if not exists horse_listings_discipline_idx on public.horse_listings (discipline);
create index if not exists horse_listings_created_at_idx on public.horse_listings (created_at desc);

create or replace function public.set_horse_listings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists horse_listings_updated_at on public.horse_listings;

create trigger horse_listings_updated_at
before update on public.horse_listings
for each row
execute function public.set_horse_listings_updated_at();

alter table public.horse_listings enable row level security;

drop policy if exists "Public can read active horse listings" on public.horse_listings;
create policy "Public can read active horse listings"
on public.horse_listings
for select
using (status = 'active');

drop policy if exists "Users can read own horse listings" on public.horse_listings;
create policy "Users can read own horse listings"
on public.horse_listings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own horse listings" on public.horse_listings;
create policy "Users can create own horse listings"
on public.horse_listings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own horse listings" on public.horse_listings;
create policy "Users can update own horse listings"
on public.horse_listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own horse listings" on public.horse_listings;
create policy "Users can delete own horse listings"
on public.horse_listings
for delete
to authenticated
using (auth.uid() = user_id);

-- Required so Supabase API roles can access the table (RLS still applies).
grant select on public.horse_listings to anon;
grant select, insert, update, delete on public.horse_listings to authenticated;
