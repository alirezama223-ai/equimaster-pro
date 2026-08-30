create or replace function public.get_moderation_listing_details(
  p_kind text,
  p_listing_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_moderator() then
    raise exception 'You are not authorized to moderate listings.';
  end if;

  if p_kind = 'horse_sale' then
    select to_jsonb(h)
      into result
      from public.horse_listings h
     where h.id = p_listing_id;
  elsif p_kind = 'equimarket' then
    select to_jsonb(e)
      into result
      from public.equimarket_listings e
     where e.id = p_listing_id;
  else
    raise exception 'Invalid moderation listing kind.';
  end if;

  if result is null then
    raise exception 'Listing not found.';
  end if;

  return result;
end;
$$;

revoke all on function public.get_moderation_listing_details(text, uuid) from public;
grant execute on function public.get_moderation_listing_details(text, uuid) to authenticated;
