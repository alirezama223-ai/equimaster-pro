-- EquiMaster Pro Sprint 028: Central Horse Event Engine
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–026).
--
-- Creates horse_events for event-driven cross-module notifications.
-- Reuses can_manage_pedigree_horse_training ownership gate from migration 020.
-- No seed data.

-- ---------------------------------------------------------------------------
-- horse_events — central event log for all modules
-- ---------------------------------------------------------------------------
create table if not exists public.horse_events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  horse_id uuid not null references public.pedigree_horses (id) on delete cascade,
  event_type text not null,
  severity text not null check (
    severity in ('info', 'watch', 'alert', 'positive')
  ),
  title text not null,
  description text not null,
  source_module text not null check (
    source_module in ('training', 'health', 'analytics', 'rule_engine')
  ),
  dedupe_key text not null,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint horse_events_title_not_blank check (length(trim(title)) > 0),
  constraint horse_events_description_not_blank check (length(trim(description)) > 0),
  constraint horse_events_dedupe_key_not_blank check (length(trim(dedupe_key)) > 0),
  constraint horse_events_resolved_at_consistency check (
    (resolved = false and resolved_at is null)
    or (resolved = true and resolved_at is not null)
  )
);

create index if not exists horse_events_created_by_idx
  on public.horse_events (created_by);
create index if not exists horse_events_horse_id_idx
  on public.horse_events (horse_id);
create index if not exists horse_events_created_at_idx
  on public.horse_events (created_at desc);
create index if not exists horse_events_source_module_idx
  on public.horse_events (source_module);
create index if not exists horse_events_event_type_idx
  on public.horse_events (event_type);
create index if not exists horse_events_unresolved_idx
  on public.horse_events (created_by, resolved, severity, created_at desc)
  where resolved = false;

create unique index if not exists horse_events_active_dedupe_idx
  on public.horse_events (created_by, horse_id, source_module, dedupe_key)
  where resolved = false;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.horse_events enable row level security;

drop policy if exists "Users can read own horse events" on public.horse_events;
create policy "Users can read own horse events"
on public.horse_events for select to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create own horse events" on public.horse_events;
create policy "Users can create own horse events"
on public.horse_events for insert to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(horse_id)
);

drop policy if exists "Users can update own horse events" on public.horse_events;
create policy "Users can update own horse events"
on public.horse_events for update to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(horse_id)
);

drop policy if exists "Users can delete own horse events" on public.horse_events;
create policy "Users can delete own horse events"
on public.horse_events for delete to authenticated
using (created_by = auth.uid());

drop policy if exists "Admins can manage all horse events" on public.horse_events;
create policy "Admins can manage all horse events"
on public.horse_events for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on public.horse_events from anon;
grant select, insert, update, delete on public.horse_events to authenticated;
