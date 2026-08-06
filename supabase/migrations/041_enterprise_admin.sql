-- EquiMaster Pro: enterprise admin panel extensions

alter table public.profiles
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'banned')),
  add column if not exists country text,
  add column if not exists seller_verification_status text not null default 'none'
    check (seller_verification_status in ('none', 'pending', 'approved', 'rejected', 'more_info')),
  add column if not exists seller_verification_documents jsonb not null default '[]'::jsonb,
  add column if not exists seller_verification_notes text;

create index if not exists profiles_account_status_idx
  on public.profiles (account_status);

create index if not exists profiles_seller_verification_status_idx
  on public.profiles (seller_verification_status)
  where seller_verification_status = 'pending';

alter table public.horse_listings
  add column if not exists rejection_reason text,
  add column if not exists featured boolean not null default false,
  add column if not exists hidden boolean not null default false;

create index if not exists horse_listings_featured_idx
  on public.horse_listings (featured, status)
  where featured = true;

create index if not exists horse_listings_hidden_idx
  on public.horse_listings (hidden, status)
  where hidden = true;

alter table public.feedback_reports
  add column if not exists assigned_admin_id uuid references auth.users (id) on delete set null,
  add column if not exists admin_reply text;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'new_message',
      'listing_favorited',
      'listing_view_milestone',
      'new_inquiry',
      'listing_published',
      'listing_expiring',
      'admin_broadcast'
    )
  );

drop policy if exists "Admins can read all conversations" on public.conversations;
create policy "Admins can read all conversations"
on public.conversations
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read all messages" on public.messages;
create policy "Admins can read all messages"
on public.messages
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read all favorites" on public.favorites;
create policy "Admins can read all favorites"
on public.favorites
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read all notifications" on public.notifications;
create policy "Admins can read all notifications"
on public.notifications
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert notifications" on public.notifications;
create policy "Admins can insert notifications"
on public.notifications
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can delete horse listings" on public.horse_listings;
create policy "Admins can delete horse listings"
on public.horse_listings
for delete
to authenticated
using (public.is_admin());

grant delete on public.horse_listings to authenticated;
grant insert on public.notifications to authenticated;

create or replace function public.admin_broadcast_notification(
  p_user_ids uuid[],
  p_title text,
  p_body text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  foreach v_user_id in array p_user_ids loop
    insert into public.notifications (user_id, type, title, body)
    values (v_user_id, 'admin_broadcast', p_title, p_body);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.admin_broadcast_notification(uuid[], text, text) from public;
grant execute on function public.admin_broadcast_notification(uuid[], text, text) to authenticated;
