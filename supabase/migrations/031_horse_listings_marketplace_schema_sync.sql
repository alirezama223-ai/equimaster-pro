-- EquiMaster Pro: horse_listings marketplace schema sync
-- Run manually in Supabase Dashboard → SQL Editor when publish fails with:
--   PGRST204 Could not find the 'published_at' column of 'horse_listings'
--
-- Idempotent repair for migrations 029_marketplace_core.sql and 030_marketplace_mvp.sql.
-- Safe to run if those migrations were never applied or only partially applied.

-- ---------------------------------------------------------------------------
-- Columns required by publish / browse / MVP (029 + 030)
-- ---------------------------------------------------------------------------
alter table public.horse_listings
  add column if not exists slug text;

alter table public.horse_listings
  add column if not exists published_at timestamptz;

alter table public.horse_listings
  add column if not exists search_vector tsvector;

alter table public.horse_listings
  add column if not exists view_count integer not null default 0;

alter table public.horse_listings
  add column if not exists public_training_summary jsonb;

alter table public.horse_listings
  add column if not exists public_health_summary jsonb;

-- ---------------------------------------------------------------------------
-- Backfill slug + published_at for existing rows
-- ---------------------------------------------------------------------------
update public.horse_listings
set slug = trim(both '-' from regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'))
  || '-'
  || left(replace(id::text, '-', ''), 8)
where slug is null or length(trim(slug)) = 0;

update public.horse_listings
set published_at = coalesce(published_at, created_at)
where status = 'active' and published_at is null;

-- ---------------------------------------------------------------------------
-- Full-text search vector (029)
-- ---------------------------------------------------------------------------
create or replace function public.horse_listings_search_vector(
  p_name text,
  p_breed text,
  p_discipline text,
  p_country text,
  p_level text,
  p_description text,
  p_color text,
  p_gender text
)
returns tsvector
language sql
immutable
as $$
  select
    setweight(to_tsvector('english', coalesce(p_name, '')), 'A')
    || setweight(to_tsvector('english', coalesce(p_breed, '')), 'B')
    || setweight(to_tsvector('english', coalesce(p_discipline, '')), 'B')
    || setweight(to_tsvector('english', coalesce(p_level, '')), 'C')
    || setweight(to_tsvector('english', coalesce(p_country, '')), 'C')
    || setweight(to_tsvector('english', coalesce(p_color, '')), 'D')
    || setweight(to_tsvector('english', coalesce(p_gender, '')), 'D')
    || setweight(to_tsvector('english', coalesce(p_description, '')), 'D');
$$;

create or replace function public.set_horse_listings_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := public.horse_listings_search_vector(
    new.name,
    new.breed,
    new.discipline,
    new.country,
    new.level,
    new.description,
    new.color,
    new.gender
  );
  return new;
end;
$$;

drop trigger if exists horse_listings_search_vector on public.horse_listings;
create trigger horse_listings_search_vector
before insert or update of name, breed, discipline, country, level, description, color, gender
on public.horse_listings
for each row
execute function public.set_horse_listings_search_vector();

update public.horse_listings
set search_vector = public.horse_listings_search_vector(
  name,
  breed,
  discipline,
  country,
  level,
  description,
  color,
  gender
)
where search_vector is null;

-- ---------------------------------------------------------------------------
-- Constraints + indexes
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
    null;
end;
$$;

alter table public.horse_listings
  drop constraint if exists horse_listings_view_count_non_negative;

alter table public.horse_listings
  add constraint horse_listings_view_count_non_negative check (view_count >= 0);

create unique index if not exists horse_listings_slug_unique_idx
  on public.horse_listings (slug);

create index if not exists horse_listings_search_vector_idx
  on public.horse_listings using gin (search_vector);

create index if not exists horse_listings_marketplace_active_idx
  on public.horse_listings (status, created_at desc)
  where status = 'active';

create index if not exists horse_listings_marketplace_discipline_idx
  on public.horse_listings (discipline, status)
  where status = 'active';

create index if not exists horse_listings_marketplace_country_idx
  on public.horse_listings (country, status)
  where status = 'active';

create index if not exists horse_listings_marketplace_gender_idx
  on public.horse_listings (gender, status)
  where status = 'active';

create index if not exists horse_listings_marketplace_price_idx
  on public.horse_listings (price)
  where status = 'active' and price is not null;

create index if not exists horse_listings_marketplace_age_idx
  on public.horse_listings (age)
  where status = 'active';

create index if not exists horse_listings_marketplace_height_idx
  on public.horse_listings (height)
  where status = 'active';

create index if not exists horse_listings_published_at_idx
  on public.horse_listings (published_at desc nulls last)
  where status = 'active';

create index if not exists horse_listings_view_count_idx
  on public.horse_listings (view_count desc)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- View count RPC (030)
-- ---------------------------------------------------------------------------
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
