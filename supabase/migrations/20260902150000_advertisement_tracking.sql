-- Public-safe advertisement counters.
-- Functions validate the campaign is active and within its scheduled window.

create or replace function public.track_ad_impression(p_ad_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.advertisements
  set impressions = impressions + 1,
      updated_at = now()
  where id = p_ad_id
    and status = 'active'
    and start_at <= now()
    and end_at > now();
  return found;
end;
$$;

create or replace function public.track_ad_click(p_ad_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.advertisements
  set clicks = clicks + 1,
      updated_at = now()
  where id = p_ad_id
    and status = 'active'
    and start_at <= now()
    and end_at > now();
  return found;
end;
$$;

grant execute on function public.track_ad_impression(uuid) to anon, authenticated;
grant execute on function public.track_ad_click(uuid) to anon, authenticated;
