-- EquiMaster Pro: listing views tracking + user notifications

create table if not exists public.listing_views (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.horse_listings (id) on delete cascade,
  viewer_id uuid references auth.users (id) on delete set null,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint listing_views_guest_fingerprint check (
    viewer_id is not null
    or (ip_hash is not null and user_agent is not null)
  )
);

create index if not exists listing_views_listing_id_created_at_idx
  on public.listing_views (listing_id, created_at desc);
create index if not exists listing_views_viewer_dedup_idx
  on public.listing_views (listing_id, viewer_id, created_at desc)
  where viewer_id is not null;
create index if not exists listing_views_guest_dedup_idx
  on public.listing_views (listing_id, ip_hash, user_agent, created_at desc)
  where viewer_id is null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (
    type in (
      'new_message',
      'listing_favorited',
      'listing_view_milestone',
      'new_inquiry',
      'listing_published',
      'listing_expiring'
    )
  ),
  title text not null,
  body text not null,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_id_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;
create index if not exists notifications_entity_id_idx
  on public.notifications (entity_id)
  where entity_id is not null;

alter table public.listing_views enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Sellers can read listing views for own listings" on public.listing_views;
create policy "Sellers can read listing views for own listings"
on public.listing_views
for select
to authenticated
using (
  exists (
    select 1
    from public.horse_listings hl
    where hl.id = listing_id
      and hl.user_id = auth.uid()
  )
);

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can mark own notifications read" on public.notifications;
create policy "Users can mark own notifications read"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select on public.listing_views to authenticated;
grant select, update on public.notifications to authenticated;

create or replace function public.create_user_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_entity_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, entity_id)
  values (p_user_id, p_type, p_title, p_body, p_entity_id)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_user_notification(uuid, text, text, text, uuid) from public;

create or replace function public.record_listing_view(
  p_listing_id uuid,
  p_viewer_id uuid,
  p_ip_hash text,
  p_user_agent text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_listing_name text;
  v_view_count integer;
  v_milestone integer;
begin
  select hl.user_id, hl.name
  into v_seller_id, v_listing_name
  from public.horse_listings hl
  where hl.id = p_listing_id
    and hl.status = 'active';

  if not found then
    return false;
  end if;

  if p_viewer_id is not null and p_viewer_id = v_seller_id then
    return false;
  end if;

  if p_viewer_id is not null then
    if exists (
      select 1
      from public.listing_views lv
      where lv.listing_id = p_listing_id
        and lv.viewer_id = p_viewer_id
        and lv.created_at > now() - interval '24 hours'
    ) then
      return false;
    end if;
  else
    if p_ip_hash is null or char_length(trim(p_ip_hash)) = 0
      or p_user_agent is null or char_length(trim(p_user_agent)) = 0 then
      return false;
    end if;

    if exists (
      select 1
      from public.listing_views lv
      where lv.listing_id = p_listing_id
        and lv.viewer_id is null
        and lv.ip_hash = p_ip_hash
        and lv.user_agent = p_user_agent
        and lv.created_at > now() - interval '24 hours'
    ) then
      return false;
    end if;
  end if;

  insert into public.listing_views (listing_id, viewer_id, ip_hash, user_agent)
  values (
    p_listing_id,
    p_viewer_id,
    case when p_viewer_id is null then p_ip_hash else null end,
    case when p_viewer_id is null then left(p_user_agent, 512) else null end
  );

  update public.horse_listings
  set view_count = view_count + 1
  where id = p_listing_id
  returning view_count into v_view_count;

  foreach v_milestone in array array[10, 50, 100, 500, 1000] loop
    if v_view_count = v_milestone then
      perform public.create_user_notification(
        v_seller_id,
        'listing_view_milestone',
        format('Listing reached %s views', v_milestone),
        format('%s has reached %s views.', coalesce(v_listing_name, 'Your listing'), v_milestone),
        p_listing_id
      );
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function public.record_listing_view(uuid, uuid, text, text) from public;
grant execute on function public.record_listing_view(uuid, uuid, text, text) to anon, authenticated;

create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation public.conversations%rowtype;
  v_recipient_id uuid;
  v_listing_name text;
begin
  select * into v_conversation
  from public.conversations
  where id = new.conversation_id;

  if not found then
    return new;
  end if;

  select name into v_listing_name
  from public.horse_listings
  where id = v_conversation.horse_listing_id;

  if new.sender_id = v_conversation.buyer_id then
    v_recipient_id := v_conversation.seller_id;
  else
    v_recipient_id := v_conversation.buyer_id;
  end if;

  perform public.create_user_notification(
    v_recipient_id,
    'new_message',
    'New message',
    left(
      coalesce(v_listing_name, 'A listing') || ': ' || new.body,
      240
    ),
    new.conversation_id
  );

  return new;
end;
$$;

drop trigger if exists messages_notify_recipient on public.messages;
create trigger messages_notify_recipient
after insert on public.messages
for each row
execute function public.notify_on_new_message();

create or replace function public.notify_on_listing_favorited()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_listing_name text;
  v_favorite_count integer;
begin
  select hl.user_id, hl.name
  into v_seller_id, v_listing_name
  from public.horse_listings hl
  where hl.id = new.horse_listing_id;

  if not found then
    return new;
  end if;

  select count(*) into v_favorite_count
  from public.favorites f
  where f.horse_listing_id = new.horse_listing_id;

  if v_favorite_count = 1 then
    perform public.create_user_notification(
      v_seller_id,
      'listing_favorited',
      'First favorite',
      coalesce(v_listing_name, 'Your listing') || ' received its first favorite.',
      new.horse_listing_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists favorites_notify_seller on public.favorites;
create trigger favorites_notify_seller
after insert on public.favorites
for each row
execute function public.notify_on_listing_favorited();

create or replace function public.notify_on_new_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_name text;
begin
  select name into v_listing_name
  from public.horse_listings
  where id = new.horse_listing_id;

  perform public.create_user_notification(
    new.seller_id,
    'new_inquiry',
    'New inquiry',
    coalesce(new.buyer_name, 'A buyer') || ' inquired about ' || coalesce(v_listing_name, 'your listing') || '.',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists inquiries_notify_seller on public.inquiries;
create trigger inquiries_notify_seller
after insert on public.inquiries
for each row
execute function public.notify_on_new_inquiry();

create or replace function public.notify_on_listing_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from 'active' and new.status = 'active' then
    perform public.create_user_notification(
      new.user_id,
      'listing_published',
      'Listing published',
      coalesce(new.name, 'Your listing') || ' is now live on the marketplace.',
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists horse_listings_notify_published on public.horse_listings;
create trigger horse_listings_notify_published
after update of status on public.horse_listings
for each row
execute function public.notify_on_listing_published();

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

-- Sync cached view counts from recorded views when present.
update public.horse_listings hl
set view_count = src.view_total
from (
  select listing_id, count(*)::integer as view_total
  from public.listing_views
  group by listing_id
) src
where hl.id = src.listing_id
  and hl.view_count < src.view_total;
