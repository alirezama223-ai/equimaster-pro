-- EquiMaster Pro: user favorites for horse listings
-- Run this manually in Supabase Dashboard → SQL Editor

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  horse_listing_id uuid not null references public.horse_listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, horse_listing_id)
);

create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_horse_listing_id_idx on public.favorites (horse_listing_id);
create index if not exists favorites_user_id_created_at_idx on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

drop policy if exists "Users can read own favorites" on public.favorites;
create policy "Users can read own favorites"
on public.favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites"
on public.favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
on public.favorites
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, delete on public.favorites to authenticated;
