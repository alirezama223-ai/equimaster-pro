create or replace function public.route_new_horse_listing_to_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' then
    new.status := 'pending';
    new.published_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_route_new_horse_listing_to_moderation on public.horse_listings;
create trigger trg_route_new_horse_listing_to_moderation
before insert on public.horse_listings
for each row
execute function public.route_new_horse_listing_to_moderation();
