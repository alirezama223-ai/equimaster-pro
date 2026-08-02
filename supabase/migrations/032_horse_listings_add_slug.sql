-- EquiMaster Pro: add missing horse_listings.slug column
-- Run in Supabase Dashboard → SQL Editor when publish fails with:
--   PGRST204 Could not find the 'slug' column of 'horse_listings'
--
-- Idempotent. Safe to run even if slug already exists.

-- ---------------------------------------------------------------------------
-- 1) Verify current schema (inspect results before/after)
-- ---------------------------------------------------------------------------
-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'horse_listings'
--   and column_name in ('slug', 'published_at', 'search_vector', 'view_count')
-- order by column_name;

-- ---------------------------------------------------------------------------
-- 2) Add slug column
-- ---------------------------------------------------------------------------
alter table public.horse_listings
  add column if not exists slug text;

-- ---------------------------------------------------------------------------
-- 3) Backfill slug for existing rows (unique per listing via id suffix)
-- ---------------------------------------------------------------------------
update public.horse_listings
set slug = trim(both '-' from regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'))
  || '-'
  || left(replace(id::text, '-', ''), 8)
where slug is null or length(trim(slug)) = 0;

-- ---------------------------------------------------------------------------
-- 4) Unique index (skip if duplicates exist — run diagnostic below first)
-- ---------------------------------------------------------------------------
create unique index if not exists horse_listings_slug_unique_idx
  on public.horse_listings (slug);

-- ---------------------------------------------------------------------------
-- 5) Optional NOT NULL (only when every row has a slug)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from public.horse_listings
    where slug is null or length(trim(slug)) = 0
  ) then
    alter table public.horse_listings
      alter column slug set not null;
  end if;
exception
  when others then
    raise notice 'slug NOT NULL skipped: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) Refresh PostgREST schema cache
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- Diagnostic if unique index fails:
-- select slug, count(*) from public.horse_listings group by slug having count(*) > 1;
