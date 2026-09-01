-- Scheduled, moderated advertising inventory for homepage placements.
-- No seed/demo rows are inserted.

create table if not exists public.advertisements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 200),
  advertiser_name text not null check (char_length(trim(advertiser_name)) between 2 and 160),
  image_url text,
  target_url text not null check (target_url ~* '^https?://'),
  placement text not null check (placement in ('homepage_top', 'homepage_featured', 'homepage_bottom')),
  start_at timestamptz not null default now(),
  end_at timestamptz not null default (now() + interval '30 days'),
  status text not null default 'draft' check (status in ('draft', 'pending', 'active', 'paused', 'rejected', 'expired')),
  priority integer not null default 0 check (priority between 0 and 1000),
  impressions bigint not null default 0 check (impressions >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint advertisements_valid_window check (end_at > start_at)
);

create index if not exists advertisements_active_schedule_idx
  on public.advertisements (placement, status, start_at, end_at, priority desc);
create index if not exists advertisements_created_by_idx
  on public.advertisements (created_by, created_at desc);

create or replace function public.set_advertisements_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists advertisements_set_updated_at on public.advertisements;
create trigger advertisements_set_updated_at
before update on public.advertisements
for each row execute function public.set_advertisements_updated_at();

alter table public.advertisements enable row level security;
drop policy if exists "Public can view active advertisements" on public.advertisements;
create policy "Public can view active advertisements"
on public.advertisements
for select to anon, authenticated
using (status = 'active' and start_at <= now() and end_at > now());

drop policy if exists "Admins can manage advertisements" on public.advertisements;
create policy "Admins can manage advertisements"
on public.advertisements
for all
using (public.is_admin())
with check (public.is_admin());
