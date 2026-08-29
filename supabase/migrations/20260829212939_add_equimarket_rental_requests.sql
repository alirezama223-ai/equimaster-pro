create table if not exists public.equimarket_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_type text not null check (listing_type in ('horse_rental','horse_wanted')),
  title text not null check (char_length(title) between 5 and 140),
  description text not null check (char_length(description) between 10 and 5000),
  horse_name text,
  discipline text,
  level text,
  country text,
  city text,
  price numeric check (price is null or price >= 0),
  price_period text check (price_period is null or price_period in ('day','week','month','season','negotiable')),
  available_from date,
  available_to date,
  min_duration_weeks integer check (min_duration_weeks is null or min_duration_weeks > 0),
  competition_allowed boolean not null default false,
  coach_included boolean not null default false,
  status text not null default 'pending' check (status in ('pending','active','paused','closed','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equimarket_listings_type_status_idx on public.equimarket_listings(listing_type,status);
create index if not exists equimarket_listings_location_idx on public.equimarket_listings(country,city);
create index if not exists equimarket_listings_discipline_idx on public.equimarket_listings(discipline);

alter table public.equimarket_listings enable row level security;

create policy "public can view active equimarket listings" on public.equimarket_listings
  for select using (status = 'active' or auth.uid() = user_id);

create policy "users can create own equimarket listings" on public.equimarket_listings
  for insert with check (auth.uid() = user_id);

create policy "users can update own equimarket listings" on public.equimarket_listings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can delete own equimarket listings" on public.equimarket_listings
  for delete using (auth.uid() = user_id);

create or replace function public.set_equimarket_listings_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists equimarket_listings_updated_at on public.equimarket_listings;
create trigger equimarket_listings_updated_at before update on public.equimarket_listings
for each row execute function public.set_equimarket_listings_updated_at();
