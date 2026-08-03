-- EquiMaster Pro Sprint 10.3: Security & Database Hardening (before beta)
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–034).
--
-- 1. Protect horse_listings.verified (mirror breeders/stallions/pedigree pattern)
-- 2. Admin read/update policies on horse_listings
-- 3. Revoke anon EXECUTE on internal backfill RPCs; add caller authorization
-- 4. Idempotent repair: ensure search_vector column, trigger, and GIN index exist

-- ---------------------------------------------------------------------------
-- 1. Verified listings protection
-- ---------------------------------------------------------------------------
create or replace function public.protect_horse_listing_verified()
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

drop trigger if exists horse_listings_protect_verified on public.horse_listings;
create trigger horse_listings_protect_verified
before insert or update on public.horse_listings
for each row
execute function public.protect_horse_listing_verified();

-- Public visibility remains status-based (status = 'active'); verified is a badge
-- that only admins may toggle. Non-admins cannot self-verify to imply trust.

drop policy if exists "Admins can read all horse listings" on public.horse_listings;
create policy "Admins can read all horse listings"
on public.horse_listings
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update horse listings" on public.horse_listings;
create policy "Admins can update horse listings"
on public.horse_listings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Secure internal backfill RPCs (authenticated + ownership/admin only)
-- ---------------------------------------------------------------------------
create or replace function public.backfill_listing_pedigree_horse(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.horse_listings%rowtype;
  v_sex text;
  v_birth_year integer;
  v_sire_id uuid;
  v_dam_id uuid;
  v_dam_sire_id uuid;
  v_subject_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select *
  into v_listing
  from public.horse_listings
  where id = p_listing_id;

  if not found then
    return null;
  end if;

  if v_listing.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'not authorized to backfill listing pedigree';
  end if;

  if v_listing.pedigree_horse_id is not null then
    return v_listing.pedigree_horse_id;
  end if;

  if trim(coalesce(v_listing.name, '')) = '' then
    return null;
  end if;

  v_sex := case v_listing.gender
    when 'Mare' then 'mare'
    when 'Stallion' then 'stallion'
    when 'Gelding' then 'gelding'
    else 'unknown'
  end;

  v_birth_year := extract(year from now())::integer - coalesce(v_listing.age, 0);

  if trim(coalesce(v_listing.sire, '')) not in ('', '—') then
    v_sire_id := public.find_or_create_pedigree_horse(
      v_listing.sire,
      'stallion',
      null,
      null,
      null,
      null,
      v_listing.user_id,
      null,
      null
    );
  end if;

  if trim(coalesce(v_listing.dam, '')) not in ('', '—') then
    v_dam_id := public.find_or_create_pedigree_horse(
      v_listing.dam,
      'mare',
      null,
      null,
      null,
      null,
      v_listing.user_id,
      null,
      null
    );
  end if;

  if trim(coalesce(v_listing.dam_sire, '')) not in ('', '—') and v_dam_id is not null then
    v_dam_sire_id := public.find_or_create_pedigree_horse(
      v_listing.dam_sire,
      'stallion',
      null,
      null,
      null,
      null,
      v_listing.user_id,
      null,
      null
    );

    if v_dam_sire_id is not null then
      update public.pedigree_horses
      set sire_id = coalesce(sire_id, v_dam_sire_id)
      where id = v_dam_id
        and verified = false;
    end if;
  end if;

  v_subject_id := public.find_or_create_pedigree_horse(
    v_listing.name,
    v_sex,
    v_birth_year,
    v_listing.breed,
    v_listing.color,
    v_listing.country,
    v_listing.user_id,
    v_sire_id,
    v_dam_id
  );

  if v_subject_id is not null then
    update public.horse_listings
    set pedigree_horse_id = v_subject_id
    where id = p_listing_id
      and pedigree_horse_id is null;
  end if;

  return v_subject_id;
end;
$$;

create or replace function public.backfill_stallion_pedigree_horse(p_stallion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stallion public.stallions%rowtype;
  v_birth_year integer;
  v_sire_id uuid;
  v_dam_id uuid;
  v_dam_sire_id uuid;
  v_subject_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select *
  into v_stallion
  from public.stallions
  where id = p_stallion_id;

  if not found then
    return null;
  end if;

  if v_stallion.owner_id <> auth.uid() and not public.is_admin() then
    raise exception 'not authorized to backfill stallion pedigree';
  end if;

  if v_stallion.pedigree_horse_id is not null then
    return v_stallion.pedigree_horse_id;
  end if;

  if trim(coalesce(v_stallion.name, '')) = '' then
    return null;
  end if;

  v_birth_year := v_stallion.birth_year;

  if trim(coalesce(v_stallion.sire, '')) not in ('', '—') then
    v_sire_id := public.find_or_create_pedigree_horse(
      v_stallion.sire,
      'stallion',
      null,
      null,
      null,
      null,
      v_stallion.owner_id,
      null,
      null
    );
  end if;

  if trim(coalesce(v_stallion.dam, '')) not in ('', '—') then
    v_dam_id := public.find_or_create_pedigree_horse(
      v_stallion.dam,
      'mare',
      null,
      null,
      null,
      null,
      v_stallion.owner_id,
      null,
      null
    );
  end if;

  if trim(coalesce(v_stallion.dam_sire, '')) not in ('', '—') and v_dam_id is not null then
    v_dam_sire_id := public.find_or_create_pedigree_horse(
      v_stallion.dam_sire,
      'stallion',
      null,
      null,
      null,
      null,
      v_stallion.owner_id,
      null,
      null
    );

    if v_dam_sire_id is not null then
      update public.pedigree_horses
      set sire_id = coalesce(sire_id, v_dam_sire_id)
      where id = v_dam_id
        and verified = false;
    end if;
  end if;

  v_subject_id := public.find_or_create_pedigree_horse(
    v_stallion.name,
    'stallion',
    v_birth_year,
    v_stallion.breed,
    v_stallion.color,
    v_stallion.country,
    v_stallion.owner_id,
    v_sire_id,
    v_dam_id
  );

  if v_subject_id is not null then
    update public.stallions
    set pedigree_horse_id = v_subject_id
    where id = p_stallion_id
      and pedigree_horse_id is null;
  end if;

  return v_subject_id;
end;
$$;

revoke all on function public.backfill_listing_pedigree_horse(uuid) from public;
revoke all on function public.backfill_stallion_pedigree_horse(uuid) from public;
revoke execute on function public.backfill_listing_pedigree_horse(uuid) from anon;
revoke execute on function public.backfill_stallion_pedigree_horse(uuid) from anon;
grant execute on function public.backfill_listing_pedigree_horse(uuid) to authenticated;
grant execute on function public.backfill_stallion_pedigree_horse(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Idempotent search_vector repair (environments that skipped 029/031)
-- ---------------------------------------------------------------------------
alter table public.horse_listings
  add column if not exists search_vector tsvector;

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

create index if not exists horse_listings_search_vector_idx
  on public.horse_listings using gin (search_vector);

notify pgrst, 'reload schema';
