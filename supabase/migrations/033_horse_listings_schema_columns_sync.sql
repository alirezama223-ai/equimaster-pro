-- EquiMaster Pro: horse_listings schema column sync
-- Idempotent repair when marketplace columns were never applied.
-- Adds columns only; does not backfill or update existing rows.

alter table public.horse_listings
  add column if not exists slug text;

alter table public.horse_listings
  add column if not exists published_at timestamptz;

alter table public.horse_listings
  add column if not exists view_count integer default 0;

alter table public.horse_listings
  add column if not exists favorite_count integer default 0;

alter table public.horse_listings
  add column if not exists inquiry_count integer default 0;

create unique index if not exists horse_listings_slug_unique_idx
  on public.horse_listings (slug);

create index if not exists horse_listings_published_at_idx
  on public.horse_listings (published_at desc nulls last)
  where status = 'active';

create index if not exists horse_listings_view_count_idx
  on public.horse_listings (view_count desc)
  where status = 'active';

create index if not exists horse_listings_favorite_count_idx
  on public.horse_listings (favorite_count desc)
  where status = 'active';

create index if not exists horse_listings_inquiry_count_idx
  on public.horse_listings (inquiry_count desc)
  where status = 'active';

notify pgrst, 'reload schema';
