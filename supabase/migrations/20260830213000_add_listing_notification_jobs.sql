-- Listing notification outbox.
-- The DB records notification intent; the Vercel cron worker delivers email/SMS.
create table if not exists public.listing_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  listing_kind text not null check (listing_kind in ('horse_sale', 'equimarket')),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('submitted', 'published', 'rejected')),
  reason text,
  attempts integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_listing_notification_jobs_pending
  on public.listing_notification_jobs(status, created_at);

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type = any (array[
    'new_message'::text,
    'listing_favorited'::text,
    'listing_view_milestone'::text,
    'new_inquiry'::text,
    'listing_submitted'::text,
    'listing_published'::text,
    'listing_rejected'::text,
    'listing_expiring'::text,
    'admin_broadcast'::text
  ]));

create or replace function public.enqueue_horse_listing_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.listing_notification_jobs (listing_id, listing_kind, user_id, event_type)
    values (new.id, 'horse_sale', new.user_id, 'submitted');
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'active' then
      insert into public.listing_notification_jobs (listing_id, listing_kind, user_id, event_type)
      values (new.id, 'horse_sale', new.user_id, 'published');
    elsif new.status = 'rejected' then
      insert into public.listing_notification_jobs (listing_id, listing_kind, user_id, event_type, reason)
      values (new.id, 'horse_sale', new.user_id, 'rejected', new.rejection_reason);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enqueue_horse_listing_notification on public.horse_listings;
create trigger trg_enqueue_horse_listing_notification
after insert or update of status, rejection_reason on public.horse_listings
for each row execute function public.enqueue_horse_listing_notification();

create or replace function public.enqueue_equimarket_listing_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.listing_notification_jobs (listing_id, listing_kind, user_id, event_type)
    values (new.id, 'equimarket', new.user_id, 'submitted');
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'active' then
      insert into public.listing_notification_jobs (listing_id, listing_kind, user_id, event_type)
      values (new.id, 'equimarket', new.user_id, 'published');
    elsif new.status = 'rejected' then
      insert into public.listing_notification_jobs (listing_id, listing_kind, user_id, event_type, reason)
      values (new.id, 'equimarket', new.user_id, 'rejected', null);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enqueue_equimarket_listing_notification on public.equimarket_listings;
create trigger trg_enqueue_equimarket_listing_notification
after insert or update of status on public.equimarket_listings
for each row execute function public.enqueue_equimarket_listing_notification();

-- Notification jobs are server-side only. The worker uses the service role.
revoke all on table public.listing_notification_jobs from anon, authenticated;
