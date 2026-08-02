-- EquiMaster Pro: horse_listings schema column sync (corrected)
-- Each column is added in its own block so one failure cannot roll back the others.
-- Does not backfill or update existing rows.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'horse_listings'
      and column_name = 'slug'
  ) then
    alter table public.horse_listings add column slug text;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'horse_listings'
      and column_name = 'published_at'
  ) then
    alter table public.horse_listings add column published_at timestamptz;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'horse_listings'
      and column_name = 'view_count'
  ) then
    alter table public.horse_listings add column view_count integer default 0;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'horse_listings'
      and column_name = 'favorite_count'
  ) then
    alter table public.horse_listings add column favorite_count integer default 0;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'horse_listings'
      and column_name = 'inquiry_count'
  ) then
    alter table public.horse_listings add column inquiry_count integer default 0;
  end if;
end;
$$;

create unique index if not exists horse_listings_slug_unique_idx
  on public.horse_listings (slug)
  where slug is not null;

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
