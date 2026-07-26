-- EquiMaster Pro: idempotent pedigree backfill for marketplace listings & stallions
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–016).
--
-- Why: Phase 8 sync runs only on listing/stallion create/update. Historical active
-- records may exist in horse_listings/stallions without pedigree_horse_id, so Breeding
-- Lab search (pedigree_horses-only) returns no matches.

create or replace function public.normalize_pedigree_name_sql(input text)
returns text
language sql
immutable
as $$
  select trim(
    both ' ' from regexp_replace(
      regexp_replace(lower(trim(coalesce(input, ''))), '[^a-z0-9]+', ' ', 'g'),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

create or replace function public.find_pedigree_match(
  p_name text,
  p_sex text,
  p_birth_year integer default null
)
returns uuid
language plpgsql
stable
set search_path = public
as $$
declare
  v_normalized text;
  v_id uuid;
begin
  v_normalized := public.normalize_pedigree_name_sql(p_name);
  if v_normalized = '' then
    return null;
  end if;

  if p_birth_year is not null and p_sex is not null and p_sex <> 'unknown' then
    select ph.id
    into v_id
    from public.pedigree_horses ph
    where ph.normalized_name = v_normalized
      and ph.sex = p_sex
      and ph.birth_year = p_birth_year
    limit 1;

    if v_id is not null then
      return v_id;
    end if;
  end if;

  return null;
end;
$$;

create or replace function public.find_or_create_pedigree_horse(
  p_name text,
  p_sex text,
  p_birth_year integer,
  p_breed text,
  p_color text,
  p_country text,
  p_user_id uuid,
  p_sire_id uuid default null,
  p_dam_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_normalized text;
begin
  v_normalized := public.normalize_pedigree_name_sql(p_name);
  if v_normalized = '' then
    return null;
  end if;

  v_id := public.find_pedigree_match(p_name, p_sex, p_birth_year);
  if v_id is not null then
    update public.pedigree_horses
    set
      sire_id = coalesce(sire_id, p_sire_id),
      dam_id = coalesce(dam_id, p_dam_id)
    where id = v_id
      and verified = false;

    return v_id;
  end if;

  insert into public.pedigree_horses (
    name,
    normalized_name,
    sex,
    birth_year,
    breed,
    color,
    country,
    sire_id,
    dam_id,
    created_by,
    verified
  )
  values (
    trim(p_name),
    v_normalized,
    coalesce(nullif(p_sex, ''), 'unknown'),
    p_birth_year,
    nullif(trim(coalesce(p_breed, '')), ''),
    nullif(trim(coalesce(p_color, '')), ''),
    nullif(trim(coalesce(p_country, '')), ''),
    p_sire_id,
    p_dam_id,
    p_user_id,
    false
  )
  returning id into v_id;

  return v_id;
end;
$$;

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
  select *
  into v_listing
  from public.horse_listings
  where id = p_listing_id;

  if not found then
    return null;
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
  select *
  into v_stallion
  from public.stallions
  where id = p_stallion_id;

  if not found then
    return null;
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

revoke all on function public.normalize_pedigree_name_sql(text) from public;
revoke all on function public.find_pedigree_match(text, text, integer) from public;
revoke all on function public.find_or_create_pedigree_horse(text, text, integer, text, text, text, uuid, uuid, uuid) from public;

grant execute on function public.backfill_listing_pedigree_horse(uuid) to anon, authenticated;
grant execute on function public.backfill_stallion_pedigree_horse(uuid) to anon, authenticated;

-- One-time idempotent backfill for existing active records.
do $$
declare
  listing_record record;
  stallion_record record;
begin
  for listing_record in
    select id
    from public.horse_listings
    where status = 'active'
      and pedigree_horse_id is null
      and trim(coalesce(name, '')) <> ''
  loop
    perform public.backfill_listing_pedigree_horse(listing_record.id);
  end loop;

  for stallion_record in
    select id
    from public.stallions
    where status = 'active'
      and pedigree_horse_id is null
      and trim(coalesce(name, '')) <> ''
  loop
    perform public.backfill_stallion_pedigree_horse(stallion_record.id);
  end loop;
end;
$$;
