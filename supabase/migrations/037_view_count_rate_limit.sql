-- Rate-limit listing view count inflation (max 500 increments per slug per hour).
-- Complements app-level IP throttling in incrementListingViewCount.

create table if not exists public.listing_view_hourly (
  slug text not null,
  hour_bucket timestamptz not null,
  increment_count integer not null default 0,
  primary key (slug, hour_bucket)
);

alter table public.listing_view_hourly enable row level security;

revoke all on public.listing_view_hourly from public;
revoke all on public.listing_view_hourly from anon, authenticated;

create or replace function public.increment_horse_listing_view_count(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket timestamptz := date_trunc('hour', timezone('utc', now()));
  v_count integer;
  v_max_per_hour constant integer := 500;
begin
  if p_slug is null
    or length(trim(p_slug)) = 0
    or length(p_slug) > 120
    or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  then
    return;
  end if;

  insert into public.listing_view_hourly (slug, hour_bucket, increment_count)
  values (p_slug, v_bucket, 1)
  on conflict (slug, hour_bucket)
  do update
    set increment_count = public.listing_view_hourly.increment_count + 1
  returning increment_count into v_count;

  if v_count > v_max_per_hour then
    return;
  end if;

  update public.horse_listings
  set view_count = view_count + 1
  where slug = p_slug
    and status = 'active';
end;
$$;

revoke all on function public.increment_horse_listing_view_count(text) from public;
grant execute on function public.increment_horse_listing_view_count(text) to anon, authenticated;
