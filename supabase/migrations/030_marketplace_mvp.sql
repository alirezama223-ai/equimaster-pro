-- EquiMaster Pro Sprint 029.2: Marketplace MVP
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–029).
--
-- Adds view tracking and publish-time public snapshots for training/health summaries.
-- pedigree_horse_id is the canonical horse reference (horse_id).

alter table public.horse_listings
  add column if not exists view_count integer not null default 0;

alter table public.horse_listings
  add column if not exists public_training_summary jsonb;

alter table public.horse_listings
  add column if not exists public_health_summary jsonb;

alter table public.horse_listings
  drop constraint if exists horse_listings_view_count_non_negative;

alter table public.horse_listings
  add constraint horse_listings_view_count_non_negative check (view_count >= 0);

create index if not exists horse_listings_view_count_idx
  on public.horse_listings (view_count desc)
  where status = 'active';

-- Increment view count for active listings (callable by anon/authenticated).
create or replace function public.increment_horse_listing_view_count(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.horse_listings
  set view_count = view_count + 1
  where slug = p_slug
    and status = 'active';
end;
$$;

revoke all on function public.increment_horse_listing_view_count(text) from public;
grant execute on function public.increment_horse_listing_view_count(text) to anon, authenticated;
