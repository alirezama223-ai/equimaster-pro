-- EquiMaster Pro Sprint 031: Marketplace Core
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–028).
--
-- Adds SEO slug, publish timestamp, full-text search vector, and marketplace indexes.
-- Listings reference pedigree_horses via pedigree_horse_id (canonical horse record).

-- ---------------------------------------------------------------------------
-- Slug + publish metadata
-- ---------------------------------------------------------------------------
alter table public.horse_listings
  add column if not exists slug text;

alter table public.horse_listings
  add column if not exists published_at timestamptz;

alter table public.horse_listings
  add column if not exists search_vector tsvector;

-- Backfill slug for existing rows
update public.horse_listings
set slug = trim(both '-' from regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'))
  || '-'
  || left(replace(id::text, '-', ''), 8)
where slug is null or length(trim(slug)) = 0;

update public.horse_listings
set published_at = coalesce(published_at, created_at)
where status = 'active' and published_at is null;

-- ---------------------------------------------------------------------------
-- Full-text search vector maintenance
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

-- Backfill search vector
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
alter table public.horse_listings
  alter column slug set not null;

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
