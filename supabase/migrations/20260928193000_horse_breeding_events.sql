create table if not exists public.horse_breeding_events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  pedigree_horse_id uuid not null references public.pedigree_horses(id) on delete cascade,
  event_date date not null,
  event_type text not null default 'insemination',
  stallion_name text,
  method text,
  pregnancy_status text,
  ultrasound_date date,
  expected_foaling_date date,
  foaling_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.horse_breeding_events enable row level security;

drop policy if exists horse_breeding_events_owner_select on public.horse_breeding_events;
drop policy if exists horse_breeding_events_owner_insert on public.horse_breeding_events;
drop policy if exists horse_breeding_events_owner_update on public.horse_breeding_events;
drop policy if exists horse_breeding_events_owner_delete on public.horse_breeding_events;

create policy horse_breeding_events_owner_select on public.horse_breeding_events
  for select using (auth.uid() = created_by);
create policy horse_breeding_events_owner_insert on public.horse_breeding_events
  for insert with check (auth.uid() = created_by);
create policy horse_breeding_events_owner_update on public.horse_breeding_events
  for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy horse_breeding_events_owner_delete on public.horse_breeding_events
  for delete using (auth.uid() = created_by);
