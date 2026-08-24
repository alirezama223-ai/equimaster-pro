-- EquiMaster Pro: Saved Search Alerts v1 — publish boundary for radius search.
-- Extends the existing radius RPC so saved-search checks can reuse the same
-- marketplace search engine without a second filtering implementation.

-- Drop the previous signature before replacing it with the additional
-- p_published_after parameter. The replacement keeps the existing behavior
-- unchanged when the parameter is null.
drop function if exists public.search_active_horse_listings_nearby(
  double precision,
  double precision,
  double precision,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  numeric,
  numeric,
  integer,
  integer,
  integer,
  integer,
  text,
  integer,
  integer,
  uuid[]
);

create function public.search_active_horse_listings_nearby(
  p_origin_lat double precision default null,
  p_origin_lng double precision default null,
  p_radius_km double precision default null,
  p_q text default null,
  p_breed text default null,
  p_country text default null,
  p_gender text default null,
  p_discipline text default null,
  p_level text default null,
  p_color text default null,
  p_studbook text default null,
  p_availability text default 'all',
  p_verified_horses boolean default false,
  p_verified_sellers boolean default false,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_age integer default null,
  p_max_age integer default null,
  p_min_height integer default null,
  p_max_height integer default null,
  p_sort text default 'newest',
  p_page integer default 1,
  p_page_size integer default 12,
  p_pedigree_horse_ids uuid[] default null,
  p_published_after timestamptz default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := greatest(coalesce(p_page_size, 12), 1);
  v_offset integer := (v_page - 1) * v_page_size;
  v_total bigint := 0;
  v_listings jsonb := '[]'::jsonb;
  v_q text := nullif(trim(coalesce(p_q, '')), '');
  v_color text := nullif(trim(coalesce(p_color, '')), '');
  v_apply_radius boolean := false;
begin
  v_apply_radius :=
    p_radius_km is not null
    and p_radius_km > 0
    and p_origin_lat is not null
    and p_origin_lng is not null
    and p_origin_lat between -90 and 90
    and p_origin_lng between -180 and 180;

  with filtered as (
    select
      hl.*,
      case
        when v_apply_radius
          and hl.latitude is not null
          and hl.longitude is not null
        then public.horse_listings_haversine_km(
          p_origin_lat,
          p_origin_lng,
          hl.latitude,
          hl.longitude
        )
        else null
      end as distance_km
    from public.horse_listings hl
    where hl.status = 'active'
      and (p_published_after is null or hl.published_at >= p_published_after)
      and (p_breed is null or p_breed = 'All' or hl.breed = p_breed)
      and (p_country is null or p_country = 'All' or hl.country = p_country)
      and (p_gender is null or p_gender = 'All' or hl.gender = p_gender)
      and (p_discipline is null or p_discipline = 'All' or hl.discipline = p_discipline)
      and (p_level is null or p_level = 'All' or hl.level = p_level)
      and (v_color is null or hl.color ilike '%' || replace(replace(replace(v_color, '%', ' '), '_', ' '), ',', ' ') || '%')
      and (not coalesce(p_verified_horses, false) or hl.verified = true)
      and (not coalesce(p_verified_sellers, false) or hl.owner_seller_verified = true)
      and (
        coalesce(p_availability, 'all') = 'all'
        or (p_availability = 'priced' and hl.price_on_request = false)
        or (p_availability = 'on_request' and hl.price_on_request = true)
      )
      and (p_min_price is null or hl.price >= p_min_price)
      and (p_max_price is null or hl.price <= p_max_price)
      and (p_min_age is null or hl.age >= p_min_age)
      and (p_max_age is null or hl.age <= p_max_age)
      and (p_min_height is null or hl.height >= p_min_height)
      and (p_max_height is null or hl.height <= p_max_height)
      and (
        p_pedigree_horse_ids is null
        or hl.pedigree_horse_id = any (p_pedigree_horse_ids)
      )
      and (
        not v_apply_radius
        or (
          hl.latitude is not null
          and hl.longitude is not null
          and public.horse_listings_haversine_km(
            p_origin_lat,
            p_origin_lng,
            hl.latitude,
            hl.longitude
          ) <= p_radius_km
        )
      )
      and (
        v_q is null
        or hl.search_vector @@ websearch_to_tsquery('english', v_q)
        or hl.name ilike '%' || v_q || '%'
        or hl.breed ilike '%' || v_q || '%'
        or hl.discipline ilike '%' || v_q || '%'
        or hl.country ilike '%' || v_q || '%'
        or hl.level ilike '%' || v_q || '%'
        or hl.color ilike '%' || v_q || '%'
        or hl.description ilike '%' || v_q || '%'
        or hl.sire ilike '%' || v_q || '%'
        or hl.dam ilike '%' || v_q || '%'
        or hl.dam_sire ilike '%' || v_q || '%'
        or hl.seller_name ilike '%' || v_q || '%'
        or coalesce(hl.stable_name, '') ilike '%' || v_q || '%'
      )
  ),
  counted as (
    select count(*)::bigint as total_count from filtered
  ),
  sorted as (
    select f.*
    from filtered f
    order by
      case when coalesce(p_sort, 'newest') = 'oldest' then f.published_at end asc nulls last,
      case when coalesce(p_sort, 'newest') = 'oldest' then f.created_at end asc,
      case when p_sort = 'price-asc' then f.price end asc nulls last,
      case when p_sort = 'price-desc' then f.price end desc nulls last,
      case when p_sort = 'age-asc' then f.age end asc,
      case when p_sort = 'age-desc' then f.age end desc,
      case when p_sort = 'height-asc' then f.height end asc,
      case when p_sort = 'height-desc' then f.height end desc,
      case when p_sort = 'featured' then f.verified end desc,
      case when p_sort = 'featured' then f.view_count end desc nulls last,
      case when p_sort = 'featured' then f.published_at end desc nulls last,
      f.published_at desc nulls last,
      f.created_at desc
    offset v_offset
    limit v_page_size
  )
  select
    (select total_count from counted),
    coalesce(
      (
        select jsonb_agg(to_jsonb(s) - 'distance_km')
        from sorted s
      ),
      '[]'::jsonb
    )
  into v_total, v_listings;

  return jsonb_build_object(
    'total', coalesce(v_total, 0),
    'listings', coalesce(v_listings, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.search_active_horse_listings_nearby(
  double precision,
  double precision,
  double precision,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  numeric,
  numeric,
  integer,
  integer,
  integer,
  integer,
  text,
  integer,
  integer,
  uuid[],
  timestamptz
) from public;
grant execute on function public.search_active_horse_listings_nearby(
  double precision,
  double precision,
  double precision,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  numeric,
  numeric,
  integer,
  integer,
  integer,
  integer,
  text,
  integer,
  integer,
  uuid[],
  timestamptz
) to anon, authenticated;
